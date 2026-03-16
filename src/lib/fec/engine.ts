// ============================================================
// FEC Analyzer — Computation Engine
// Applies mapping to parsed FEC entries → P&L, BFR, KPIs
// ============================================================

import type {
  FecEntry,
  PnlMappingLine,
  BfrMappingLine,
  PnlLineResult,
  BfrLineResult,
  BfrMonthResult,
  AccountDetail,
  EntryDetail,
  AnalysisResult,
  AngloSaxonLineResult,
  AngloSaxonMappingLine,
  Company,
  CompanySector,
  KpiResult,
  MultiYearAnalysisResult,
} from "./types";
import {
  PNL_MAPPING,
  BFR_MAPPING,
  KPI_MAPPING,
  ANGLO_SAXON_PNL_MAPPING,
  PNL_EXCLUDED_JOURNALS,
  CLOSURE_JOURNALS,
  PNL_EXCLUDED_ACCOUNT_PREFIXES,
} from "./mapping";

// ============================================================
// UTILITIES
// ============================================================

/**
 * Check if an account number matches a prefix.
 * "60110000" starts with "601" → true
 */
function matchesPrefix(compteNum: string, prefix: string): boolean {
  return compteNum.startsWith(prefix);
}

/**
 * Check if an account should be excluded based on exclusion prefixes.
 * Uses longest-prefix-first matching.
 */
function isExcluded(compteNum: string, excludes: string[]): boolean {
  return excludes.some((ex) => compteNum.startsWith(ex));
}

/**
 * Find the best matching mapping line for an account.
 * Uses longest-prefix-first matching with proper exclusion handling.
 *
 * CRITICAL (M&A/TS): Exclusions are evaluated DURING matching, not after.
 * A rule is only a valid candidate if the account matches its prefix AND
 * does NOT match any of its pcg_exclude prefixes. Among valid candidates,
 * the one with the longest matching prefix wins.
 *
 * This ensures an account excluded from a "parent" rule (e.g. 445 excluded
 * from prefix "44") can be caught by a more specific rule (e.g. prefix "4456")
 * OR by a shorter rule that doesn't exclude it.
 */
function findMappingMatch(
  compteNum: string,
  mappingLines: { id: string; pcg_prefix: string[]; pcg_exclude: string[] }[]
): string | null {
  let bestMatch: string | null = null;
  let bestPrefixLen = 0;

  for (const line of mappingLines) {
    if (line.pcg_prefix.length === 0) continue; // Skip subtotals

    // Check exclusion FIRST for this rule — if excluded, skip entire rule
    // (the account may still be caught by another rule)
    if (isExcluded(compteNum, line.pcg_exclude)) continue;

    for (const prefix of line.pcg_prefix) {
      if (prefix.length > bestPrefixLen && matchesPrefix(compteNum, prefix)) {
        bestPrefixLen = prefix.length;
        bestMatch = line.id;
      }
    }
  }

  return bestMatch;
}

/**
 * Filter P&L entries: exclude opening balance journals and result accounts.
 */
function filterPnlEntries(entries: FecEntry[]): FecEntry[] {
  return entries.filter((e) => {
    const journal = e.JournalCode.toUpperCase();

    // Exclude opening balance journals
    if (PNL_EXCLUDED_JOURNALS.includes(journal)) return false;

    // For closure journals, only keep 6x/7x accounts
    if (CLOSURE_JOURNALS.includes(journal)) {
      const firstChar = e.CompteNum.charAt(0);
      return firstChar === "6" || firstChar === "7";
    }

    // Exclude result accounts (12x, 89x) at closing date
    for (const prefix of PNL_EXCLUDED_ACCOUNT_PREFIXES) {
      if (e.CompteNum.startsWith(prefix)) return false;
    }

    return true;
  });
}

/**
 * Parse a formula string and evaluate it against computed line values.
 * Formula syntax: "PL_010 - PL_012 + PL_020"
 */
function evaluateFormula(
  formula: string,
  values: Map<string, number>
): number {
  // Tokenize: split by + and - while keeping the operator
  const tokens = formula.match(/[+-]?\s*[A-Z_0-9]+/g);
  if (!tokens) return 0;

  let result = 0;
  for (const token of tokens) {
    const trimmed = token.trim();
    const isNegative = trimmed.startsWith("-");
    const id = trimmed.replace(/^[+-]\s*/, "");
    const value = values.get(id) ?? 0;
    result += isNegative ? -value : value;
  }

  // Handle first token without explicit sign
  const firstToken = tokens[0].trim();
  if (!firstToken.startsWith("+") && !firstToken.startsWith("-")) {
    // Already handled correctly by the loop above
  }

  return result;
}

/**
 * Get year-month string from a date: "2023-01"
 */
function getYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

// ============================================================
// P&L COMPUTATION
// ============================================================

export function computePnl(entries: FecEntry[]): PnlLineResult[] {
  // 1. Filter entries for P&L
  const pnlEntries = filterPnlEntries(entries);

  // 2. Build an index: mapping line ID → aggregated amounts + details + raw entries
  const lineAggregates = new Map<
    string,
    { debitTotal: number; creditTotal: number; accounts: Map<string, AccountDetail>; rawEntries: FecEntry[] }
  >();

  // Initialize for all account-type lines
  for (const line of PNL_MAPPING) {
    if (line.type === "account") {
      lineAggregates.set(line.id, {
        debitTotal: 0,
        creditTotal: 0,
        accounts: new Map(),
        rawEntries: [],
      });
    }
  }

  // 3. Classify each entry into the appropriate mapping line
  const accountLines = PNL_MAPPING.filter((l) => l.type === "account");

  for (const entry of pnlEntries) {
    const matchId = findMappingMatch(entry.CompteNum, accountLines);
    if (!matchId) continue; // Unmapped account

    const agg = lineAggregates.get(matchId);
    if (!agg) continue;

    agg.debitTotal += entry.Debit;
    agg.creditTotal += entry.Credit;
    agg.rawEntries.push(entry);

    // Aggregate by account number for detail drill-down
    const existing = agg.accounts.get(entry.CompteNum);
    if (existing) {
      existing.debit += entry.Debit;
      existing.credit += entry.Credit;
      existing.entryCount += 1;
    } else {
      agg.accounts.set(entry.CompteNum, {
        compteNum: entry.CompteNum,
        compteLib: entry.CompteLib,
        debit: entry.Debit,
        credit: entry.Credit,
        solde: 0, // Will be computed after
        entryCount: 1,
      });
    }
  }

  // 4. Compute amounts for account-type lines
  const values = new Map<string, number>();

  for (const line of PNL_MAPPING) {
    if (line.type !== "account") continue;

    const agg = lineAggregates.get(line.id);
    if (!agg) {
      values.set(line.id, 0);
      continue;
    }

    let amount: number;
    if (line.sign === "credit_minus_debit") {
      amount = agg.creditTotal - agg.debitTotal;
    } else {
      // debit_minus_credit
      amount = agg.debitTotal - agg.creditTotal;
    }

    values.set(line.id, amount);

    // Compute solde for each account detail
    for (const detail of agg.accounts.values()) {
      if (line.sign === "credit_minus_debit") {
        detail.solde = detail.credit - detail.debit;
      } else {
        detail.solde = detail.debit - detail.credit;
      }
    }
  }

  // 5. Compute subtotal lines (evaluate formulas)
  for (const line of PNL_MAPPING) {
    if (line.type === "subtotal" && line.formula) {
      const amount = evaluateFormula(line.formula, values);
      values.set(line.id, amount);
    }
  }

  // 6. Build result array
  const results: PnlLineResult[] = PNL_MAPPING.map((line) => {
    const agg = lineAggregates.get(line.id);
    const details: AccountDetail[] = agg
      ? Array.from(agg.accounts.values()).sort((a, b) =>
          a.compteNum.localeCompare(b.compteNum)
        )
      : [];

    const entries: EntryDetail[] = agg
      ? agg.rawEntries.map((e) => ({
          journalCode: e.JournalCode,
          journalLib: e.JournalLib,
          ecritureNum: e.EcritureNum,
          ecritureDate: e.EcritureDate,
          pieceRef: e.PieceRef,
          ecritureLib: e.EcritureLib,
          compteNum: e.CompteNum,
          compteLib: e.CompteLib,
          debit: e.Debit,
          credit: e.Credit,
        }))
      : [];

    return {
      id: line.id,
      label: line.label,
      type: line.type,
      amount: values.get(line.id) ?? 0,
      is_key_subtotal: line.is_key_subtotal,
      restatement_flag: line.restatement_flag,
      details,
      entries,
    };
  });

  return results;
}

// ============================================================
// BFR MONTHLY COMPUTATION
// ============================================================

export function computeMonthlyBfr(entries: FecEntry[]): BfrMonthResult[] {
  // BFR includes ALL entries (including opening balances AN/RAN)
  // We compute cumulative balances at each month-end
  //
  // PERFORMANCE: O(N) Running Balance / Snapshotting algorithm
  // Instead of re-scanning all entries for each month (O(N×M)),
  // we sort entries by date, walk once, and snapshot at each month boundary.

  const accountLines = BFR_MAPPING.filter((l) => l.category !== "subtotal");
  const subtotalLines = BFR_MAPPING.filter((l) => l.category === "subtotal");

  // ── Step 1: Classify + tag each entry with its BFR line + month ──
  // Single pass O(N) to assign each entry to a BFR line
  interface TaggedEntry {
    lineId: string;
    month: string;
    compteNum: string;
    compteLib: string;
    debit: number;
    credit: number;
  }

  const tagged: TaggedEntry[] = [];
  const monthSet = new Set<string>();

  for (const entry of entries) {
    if (entry.EcritureDate.getTime() === 0) continue;
    // Skip result/opening balance accounts
    if (entry.CompteNum.startsWith("12") || entry.CompteNum.startsWith("89")) continue;

    const matchId = findMappingMatch(entry.CompteNum, accountLines);
    if (!matchId) continue;

    const month = getYearMonth(entry.EcritureDate);
    monthSet.add(month);

    tagged.push({
      lineId: matchId,
      month,
      compteNum: entry.CompteNum,
      compteLib: entry.CompteLib,
      debit: entry.Debit,
      credit: entry.Credit,
    });
  }

  const months = Array.from(monthSet).sort();
  if (months.length === 0) return [];

  // ── Step 2: Sort tagged entries by month (lexicographic = chronological) ──
  tagged.sort((a, b) => a.month.localeCompare(b.month));

  // ── Step 3: Running balance — single pass O(N) with snapshots ──
  // Running register: lineId → { debit, credit, accounts: Map<compteNum, AccountDetail> }
  type LineRegister = {
    debit: number;
    credit: number;
    accounts: Map<string, AccountDetail>;
  };

  const register = new Map<string, LineRegister>();
  for (const line of accountLines) {
    register.set(line.id, { debit: 0, credit: 0, accounts: new Map() });
  }

  const monthlyResults: BfrMonthResult[] = [];
  let entryIdx = 0;
  const totalEntries = tagged.length;

  for (const month of months) {
    // Accumulate all entries for this month into the running register
    while (entryIdx < totalEntries && tagged[entryIdx].month <= month) {
      const te = tagged[entryIdx];
      const reg = register.get(te.lineId)!;

      reg.debit += te.debit;
      reg.credit += te.credit;

      const existing = reg.accounts.get(te.compteNum);
      if (existing) {
        existing.debit += te.debit;
        existing.credit += te.credit;
        existing.entryCount += 1;
      } else {
        reg.accounts.set(te.compteNum, {
          compteNum: te.compteNum,
          compteLib: te.compteLib,
          debit: te.debit,
          credit: te.credit,
          solde: 0,
          entryCount: 1,
        });
      }

      entryIdx++;
    }

    // ── Snapshot: read current register state for this month ──
    const lines: BfrLineResult[] = [];
    const lineValues = new Map<string, number>();

    for (const mappingLine of accountLines) {
      const reg = register.get(mappingLine.id)!;

      let balance: number;
      if (mappingLine.balance === "debit_minus_credit") {
        balance = reg.debit - reg.credit;
      } else if (mappingLine.balance === "credit_minus_debit") {
        balance = reg.credit - reg.debit;
      } else {
        balance = 0;
      }

      // Compute solde for each account detail (snapshot, not clone — values are cumulative)
      const details: AccountDetail[] = [];
      for (const detail of reg.accounts.values()) {
        if (mappingLine.balance === "debit_minus_credit") {
          detail.solde = detail.debit - detail.credit;
        } else {
          detail.solde = detail.credit - detail.debit;
        }
        // Clone for snapshot (register keeps accumulating)
        details.push({ ...detail });
      }

      lineValues.set(mappingLine.id, balance);

      lines.push({
        id: mappingLine.id,
        label: mappingLine.label,
        category: mappingLine.category,
        bfr_sign: mappingLine.bfr_sign,
        amount: balance,
        linked_ratio: mappingLine.linked_ratio,
        details: details.sort((a, b) => a.compteNum.localeCompare(b.compteNum)),
        restatement_flag: mappingLine.restatement_flag,
      });
    }

    // Compute subtotals
    for (const mappingLine of subtotalLines) {
      if (!mappingLine.formula) continue;
      const amount = evaluateFormula(mappingLine.formula, lineValues);
      lineValues.set(mappingLine.id, amount);

      lines.push({
        id: mappingLine.id,
        label: mappingLine.label,
        category: mappingLine.category,
        bfr_sign: mappingLine.bfr_sign,
        amount,
        linked_ratio: mappingLine.linked_ratio,
        details: [],
        restatement_flag: mappingLine.restatement_flag,
      });
    }

    monthlyResults.push({
      month,
      lines,
      operatingAssets: lineValues.get("BFR_200") ?? 0,
      operatingLiabilities: lineValues.get("BFR_210") ?? 0,
      operatingBfr: lineValues.get("BFR_220") ?? 0,
    });
  }

  return monthlyResults;
}

// ============================================================
// ANGLO-SAXON P&L — reclassification of SIG P&L lines
// ============================================================

export function computeAngloSaxonPnl(
  sigPnl: PnlLineResult[],
  mapping: AngloSaxonMappingLine[]
): AngloSaxonLineResult[] {
  // Build lookup from SIG P&L
  const sigLookup = new Map<string, PnlLineResult>();
  for (const line of sigPnl) {
    sigLookup.set(line.id, line);
  }

  const asValues = new Map<string, number>();
  const results: AngloSaxonLineResult[] = [];

  for (const line of mapping) {
    if (line.type === "source") {
      // Aggregate from referenced PL lines
      let amount = 0;
      const mergedDetails: AccountDetail[] = [];
      const mergedEntries: EntryDetail[] = [];

      for (let i = 0; i < line.source_ids.length; i++) {
        const plId = line.source_ids[i];
        const sign = line.source_signs[i];
        const plLine = sigLookup.get(plId);

        if (plLine) {
          amount += plLine.amount * sign;

          // For source lines referencing subtotals (like PL_030), we don't have direct entries
          // For account lines, we merge their details and entries
          if (plLine.type === "account") {
            mergedDetails.push(...plLine.details);
            mergedEntries.push(...plLine.entries);
          } else if (plLine.type === "subtotal") {
            // For subtotals, collect entries from all contributing account lines
            // by traversing the SIG P&L for referenced lines
            // (entries are only on account-type lines, subtotals aggregate them)
          }
        }
      }

      asValues.set(line.id, amount);
      results.push({
        id: line.id,
        label: line.label,
        label_fr: line.label_fr,
        type: line.type,
        amount,
        is_key_subtotal: line.is_key_subtotal,
        details: mergedDetails,
        entries: mergedEntries,
      });
    } else {
      // Subtotal — evaluate formula
      const amount = evaluateFormula(line.formula!, asValues);
      asValues.set(line.id, amount);

      // For subtotals, merge details/entries from all source AS lines that feed into it
      const mergedDetails: AccountDetail[] = [];
      const mergedEntries: EntryDetail[] = [];

      results.push({
        id: line.id,
        label: line.label,
        label_fr: line.label_fr,
        type: line.type,
        amount,
        is_key_subtotal: line.is_key_subtotal,
        details: mergedDetails,
        entries: mergedEntries,
      });
    }
  }

  return results;
}

// ============================================================
// KPI COMPUTATION — driven by KPI_MAPPING table + sector filter
// ============================================================

/**
 * Evaluate a KPI formula that can include arithmetic operations.
 * Supports: +, -, *, /, parentheses, and line IDs (PL_xxx, BFR_xxx).
 * Returns null if any division by zero occurs.
 */
function evaluateKpiFormula(
  formula: string,
  values: Map<string, number>
): number | null {
  // Replace all IDs with their numeric values
  const resolved = formula.replace(/[A-Z]+_[0-9]+/g, (match) => {
    const val = values.get(match) ?? 0;
    return val.toString();
  });

  try {
    // Safe evaluation using Function constructor (no user input, only our mapping formulas)
    const fn = new Function(`"use strict"; return (${resolved});`);
    const result = fn() as number;
    if (!isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Filter KPIs relevant to a given sector.
 * A KPI is relevant if sector_relevance contains "all" or the specific sector.
 */
function filterKpisBySector(sector: CompanySector): typeof KPI_MAPPING {
  return KPI_MAPPING.filter(
    (kpi) =>
      kpi.sector_relevance.includes("all") ||
      kpi.sector_relevance.includes(sector)
  );
}

export function computeKpis(
  pnl: PnlLineResult[],
  bfr: BfrMonthResult[],
  sector: CompanySector
): KpiResult[] {
  // Build unified value map (PL_xxx + BFR_xxx)
  const allValues = new Map<string, number>();

  for (const line of pnl) {
    allValues.set(line.id, line.amount);
  }

  // BFR values from last month (closing balances)
  const lastBfr = bfr.length > 0 ? bfr[bfr.length - 1] : null;
  if (lastBfr) {
    for (const line of lastBfr.lines) {
      allValues.set(line.id, line.amount);
    }
  }

  // Filter KPIs by sector
  const relevantKpis = filterKpisBySector(sector);

  // Compute each KPI
  return relevantKpis.map((kpi) => {
    const value = evaluateKpiFormula(kpi.formula, allValues);

    // Determine if in alert zone
    let isAlert = false;
    if (value !== null) {
      if (kpi.alert_below !== null && value < kpi.alert_below) isAlert = true;
      if (kpi.alert_above !== null && value > kpi.alert_above) isAlert = true;
    }

    return {
      id: kpi.id,
      name: kpi.name,
      category: kpi.category,
      value,
      unit: kpi.unit,
      formula: kpi.formula,
      benchmark: kpi.benchmark,
      alert_below: kpi.alert_below,
      alert_above: kpi.alert_above,
      isAlert,
    };
  });
}

// ============================================================
// UNMAPPED ACCOUNTS
// ============================================================

function findUnmappedAccounts(
  entries: FecEntry[]
): { compteNum: string; compteLib: string; debit: number; credit: number }[] {
  const pnlEntries = filterPnlEntries(entries);
  const accountLines = PNL_MAPPING.filter((l) => l.type === "account");
  const bfrAccountLines = BFR_MAPPING.filter((l) => l.category !== "subtotal");

  const unmapped = new Map<
    string,
    { compteNum: string; compteLib: string; debit: number; credit: number }
  >();

  for (const entry of pnlEntries) {
    const firstChar = entry.CompteNum.charAt(0);
    // Only flag class 6 and 7 (P&L accounts) that aren't mapped
    if (firstChar !== "6" && firstChar !== "7") continue;

    const match = findMappingMatch(entry.CompteNum, accountLines);
    if (!match) {
      const existing = unmapped.get(entry.CompteNum);
      if (existing) {
        existing.debit += entry.Debit;
        existing.credit += entry.Credit;
      } else {
        unmapped.set(entry.CompteNum, {
          compteNum: entry.CompteNum,
          compteLib: entry.CompteLib,
          debit: entry.Debit,
          credit: entry.Credit,
        });
      }
    }
  }

  // Also check balance sheet accounts for BFR
  for (const entry of entries) {
    const firstChar = entry.CompteNum.charAt(0);
    if (firstChar === "6" || firstChar === "7") continue; // Already checked

    const match = findMappingMatch(entry.CompteNum, bfrAccountLines);
    // We don't flag balance sheet unmapped — too noisy. Only flag P&L.
  }

  return Array.from(unmapped.values()).sort((a, b) =>
    a.compteNum.localeCompare(b.compteNum)
  );
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

/**
 * Core analysis function: analyzes a set of FEC entries for a company.
 * This is the building block for both single-year and multi-year analysis.
 */
export function analyzeEntries(
  entries: FecEntry[],
  companyInfo: { id: string; name: string; type: Company["type"]; sector: CompanySector }
): AnalysisResult {
  // Detect fiscal year
  const dates = entries
    .map((e) => e.EcritureDate.getTime())
    .filter((t) => t > 0);
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const fiscalYear = `${minDate.toLocaleDateString("fr-FR")} — ${maxDate.toLocaleDateString("fr-FR")}`;

  // Compute P&L
  const pnl = computePnl(entries);

  // Compute Anglo-Saxon P&L (reclassification of SIG)
  const angloSaxonPnl = computeAngloSaxonPnl(pnl, ANGLO_SAXON_PNL_MAPPING);

  // Compute BFR monthly
  const bfrMonthly = computeMonthlyBfr(entries);

  // Compute KPIs (filtered by sector)
  const kpis = computeKpis(pnl, bfrMonthly, companyInfo.sector);

  // Find unmapped accounts
  const unmappedAccounts = findUnmappedAccounts(entries);

  return {
    companyId: companyInfo.id,
    companyName: companyInfo.name,
    companyType: companyInfo.type,
    companySector: companyInfo.sector,
    fiscalYear,
    entryCount: entries.length,
    pnl,
    angloSaxonPnl,
    bfrMonthly,
    kpis,
    unmappedAccounts,
  };
}

/**
 * Multi-year analysis: runs analyzeEntries() for each FEC file in a company,
 * sorted chronologically by fiscal year.
 */
export function analyzeCompanyMultiYear(company: Company): MultiYearAnalysisResult {
  const companyInfo = {
    id: company.id,
    name: company.name,
    type: company.type,
    sector: company.sector,
  };

  const yearResults: AnalysisResult[] = [];

  // Sort FEC files by fiscal year ascending
  const sortedFiles = [...company.fecFiles]
    .filter((f) => f.parsedEntries && f.parsedEntries.length > 0)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);

  for (const fecFile of sortedFiles) {
    const result = analyzeEntries(fecFile.parsedEntries!, companyInfo);
    // Override fiscalYear with the user-specified year label
    result.fiscalYear = `FY ${fecFile.fiscalYear}`;
    yearResults.push(result);
  }

  return {
    companyId: company.id,
    companyName: company.name,
    companyType: company.type,
    companySector: company.sector,
    yearResults,
  };
}
