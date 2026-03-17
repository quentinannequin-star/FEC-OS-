// ============================================================
// Quality of Earnings (QoE) — EBITDA Restatement Engine
// Extracts restatement candidates from the SIG P&L,
// computes add-backs / deductions, and derives scenario EBITDAs.
// ============================================================

import type { PnlLineResult, AnalysisResult, AccountDetail } from "./types";

// --------------- Types ---------------

export type RestatementFlag =
  | "one_off"
  | "lease_ifrs16"
  | "cvae_reclass"
  | "director_comp"
  | "capex_proxy"
  | "cir_reclass"
  | "ic_risk";

export interface RestatementAccount {
  compteNum: string;
  compteLib: string;
  solde: number;
  /** Impact on EBITDA if this account is excluded */
  ebitdaImpact: number;
}

export interface RestatementCandidate {
  lineId: string;
  label: string;
  flag: RestatementFlag;
  flagLabel: string;
  amount: number;
  /** Total EBITDA impact if ALL accounts in this line are restated */
  ebitdaImpact: number;
  isAboveEbitda: boolean;
  signConvention: "debit_minus_credit" | "credit_minus_debit";
  /** Individual accounts within this P&L line */
  accounts: RestatementAccount[];
}

export interface QoEState {
  /** Master toggle per lineId (expands/collapses) */
  toggles: Record<string, boolean>;
  /** Per-account toggle: key = "lineId:compteNum" */
  accountToggles: Record<string, boolean>;
  /** Override normative cost for director_comp */
  directorNormativeCost: number;
}

export interface QoEResult {
  reportedEbitda: number;
  adjustedEbitda: number;
  bearCaseEbitda: number;
  bullCaseEbitda: number;
  totalAddBacks: number;
  totalDeductions: number;
  variationPct: number;
  candidates: RestatementCandidate[];
}

// --------------- Constants ---------------

const FLAG_LABELS: Record<RestatementFlag, string> = {
  one_off: "Éléments non récurrents",
  lease_ifrs16: "Retraitement IFRS 16 (Crédit-bail)",
  cvae_reclass: "Reclassement CVAE",
  director_comp: "Rémunération dirigeant",
  capex_proxy: "Proxy CAPEX (Production immobilisée)",
  cir_reclass: "Reclassement CIR/CICE",
  ic_risk: "Risque intra-groupe / parties liées",
};

const SIGN_MAP: Record<string, "debit_minus_credit" | "credit_minus_debit"> = {
  PL_040: "credit_minus_debit",
  PL_050: "credit_minus_debit",
  PL_060: "credit_minus_debit",
  PL_100: "debit_minus_credit",
  PL_102: "debit_minus_credit",
  PL_104: "debit_minus_credit",
  PL_112: "debit_minus_credit",
  PL_162: "debit_minus_credit",
  PL_170: "debit_minus_credit",
  PL_172: "debit_minus_credit",
  PL_176: "debit_minus_credit",
  PL_178: "debit_minus_credit",
  PL_220: "credit_minus_debit",
  PL_222: "credit_minus_debit",
  PL_230: "debit_minus_credit",
  PL_232: "debit_minus_credit",
  PL_290: "credit_minus_debit",
  PL_292: "debit_minus_credit",
  PL_294: "credit_minus_debit",
  PL_300: "debit_minus_credit",
  PL_332: "credit_minus_debit",
};

const EBITDA_LINE_ID = "PL_180";

function isAboveEbitda(lineId: string): boolean {
  const num = parseInt(lineId.replace("PL_", ""), 10);
  return num < 180;
}

function computeAccountImpact(
  account: AccountDetail,
  sign: "debit_minus_credit" | "credit_minus_debit",
  aboveEbitda: boolean
): number {
  if (!aboveEbitda) return 0;
  const solde = Math.abs(account.solde);
  if (sign === "debit_minus_credit") {
    return solde; // charge → add-back
  } else {
    return -solde; // income → deduction
  }
}

// --------------- Core Logic ---------------

export function extractRestatementCandidates(
  pnlLines: PnlLineResult[]
): RestatementCandidate[] {
  const validFlags = new Set(Object.keys(FLAG_LABELS));
  const candidates: RestatementCandidate[] = [];

  for (const line of pnlLines) {
    if (
      !line.restatement_flag ||
      line.restatement_flag === "none" ||
      line.restatement_flag === "unmapped" ||
      !validFlags.has(line.restatement_flag)
    ) {
      continue;
    }

    if (Math.abs(line.amount) < 0.01) continue;

    const flag = line.restatement_flag as RestatementFlag;
    const sign = SIGN_MAP[line.id];
    if (!sign) continue;

    const aboveEbitda = isAboveEbitda(line.id);

    // Build account-level details
    const accounts: RestatementAccount[] = (line.details || [])
      .filter((d) => Math.abs(d.solde) > 0.01)
      .map((d) => ({
        compteNum: d.compteNum,
        compteLib: d.compteLib,
        solde: d.solde,
        ebitdaImpact: computeAccountImpact(d, sign, aboveEbitda),
      }))
      .sort((a, b) => Math.abs(b.solde) - Math.abs(a.solde));

    let ebitdaImpact = 0;
    if (aboveEbitda) {
      if (sign === "debit_minus_credit") {
        ebitdaImpact = Math.abs(line.amount);
      } else {
        ebitdaImpact = -Math.abs(line.amount);
      }
    }

    candidates.push({
      lineId: line.id,
      label: line.label,
      flag,
      flagLabel: FLAG_LABELS[flag],
      amount: line.amount,
      ebitdaImpact,
      isAboveEbitda: aboveEbitda,
      signConvention: sign,
      accounts,
    });
  }

  candidates.sort((a, b) => {
    if (a.isAboveEbitda !== b.isAboveEbitda) return a.isAboveEbitda ? -1 : 1;
    return Math.abs(b.ebitdaImpact) - Math.abs(a.ebitdaImpact);
  });

  return candidates;
}

/**
 * Compute QoE scenarios from candidates and toggle state.
 * Now uses per-account granularity: only toggled-on accounts contribute.
 */
export function computeQoE(
  reportedEbitda: number,
  candidates: RestatementCandidate[],
  state: QoEState
): QoEResult {
  let totalAddBacks = 0;
  let totalDeductions = 0;
  let activeAdjustment = 0;
  let bearAdjustment = 0;
  let bullAdjustment = 0;

  for (const c of candidates) {
    if (!c.isAboveEbitda) continue;

    const impact = c.ebitdaImpact;

    // Bear/Bull use the full line impact
    if (impact < 0) {
      bearAdjustment += impact;
      totalDeductions += impact;
    }
    if (impact > 0) {
      bullAdjustment += impact;
      totalAddBacks += impact;
    }

    // Adjusted: use per-account toggles for granularity
    if (state.toggles[c.lineId]) {
      if (c.accounts.length > 0) {
        // Sum impacts only from toggled-on accounts
        for (const acc of c.accounts) {
          const key = `${c.lineId}:${acc.compteNum}`;
          if (state.accountToggles[key]) {
            activeAdjustment += acc.ebitdaImpact;
          }
        }
      } else {
        // No account details → use full line impact
        activeAdjustment += impact;
      }

      // Director comp normative cost adjustment
      if (c.flag === "director_comp" && state.directorNormativeCost < 0) {
        activeAdjustment += state.directorNormativeCost;
      }
    }
  }

  const adjustedEbitda = reportedEbitda + activeAdjustment;
  const bearCaseEbitda = reportedEbitda + bearAdjustment;
  const bullCaseEbitda = reportedEbitda + bullAdjustment;
  const variationPct =
    reportedEbitda !== 0
      ? ((adjustedEbitda - reportedEbitda) / Math.abs(reportedEbitda)) * 100
      : 0;

  return {
    reportedEbitda,
    adjustedEbitda,
    bearCaseEbitda,
    bullCaseEbitda,
    totalAddBacks,
    totalDeductions,
    variationPct,
    candidates,
  };
}

export function getReportedEbitda(yearResult: AnalysisResult): number {
  const ebitdaLine = yearResult.pnl.find((l) => l.id === EBITDA_LINE_ID);
  return ebitdaLine?.amount ?? 0;
}

/**
 * Create initial QoE state with master toggles OFF,
 * and ALL individual account toggles ON (so when master is turned on, all accounts are included by default).
 */
export function createInitialQoEState(
  candidates: RestatementCandidate[]
): QoEState {
  const toggles: Record<string, boolean> = {};
  const accountToggles: Record<string, boolean> = {};

  for (const c of candidates) {
    toggles[c.lineId] = false;
    for (const acc of c.accounts) {
      accountToggles[`${c.lineId}:${acc.compteNum}`] = true; // ON by default
    }
  }

  return {
    toggles,
    accountToggles,
    directorNormativeCost: 0,
  };
}
