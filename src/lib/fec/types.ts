// ============================================================
// FEC Analyzer — Type Definitions
// ============================================================

/** Raw FEC entry parsed from a DGFiP-compliant file */
export interface FecEntry {
  JournalCode: string;
  JournalLib: string;
  EcritureNum: string;
  EcritureDate: Date;
  CompteNum: string;
  CompteLib: string;
  CompAuxNum: string;
  CompAuxLib: string;
  PieceRef: string;
  PieceDate: Date;
  EcritureLib: string;
  Debit: number;
  Credit: number;
  EcrtureLet: string;
  DateLet: string;
  ValidDate: string;
  Montantdevise: number;
  Idevise: string;
}

// --- Company / Scope ---

export type CompanyType = "holding" | "operationnelle";
export type CompanySector = "esn" | "btp" | "industry" | "software" | "distribution";

export const SECTOR_LABELS: Record<CompanySector, string> = {
  esn: "ESN / Conseil",
  btp: "BTP",
  industry: "Industrie",
  software: "Software / SaaS",
  distribution: "Distribution",
};

export interface FecYearFile {
  id: string;
  fiscalYear: number;
  file: File | null;
  fileName: string | null;
  fileSize: number | null;
  parsedEntries: FecEntry[] | null;
  parseError: string | null;
  entryCount: number;
}

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  sector: CompanySector;
  fecFiles: FecYearFile[];
}

// --- Mapping types (mirror the JSON structure) ---

export type SignConvention = "credit_minus_debit" | "debit_minus_credit" | "formula";
export type BalanceMethod = "debit_minus_credit" | "credit_minus_debit" | "formula";
export type LineType = "account" | "subtotal" | "ratio";
export type BfrCategory =
  | "operating_asset"
  | "operating_liability"
  | "non_operating"
  | "cash"
  | "financial_debt"
  | "subtotal";
export type BfrSign = "positive" | "negative" | "formula" | "info";
export type NetDebtCategory =
  | "bank_debt"
  | "other_financial_debt"
  | "shareholder"
  | "manual_adjustment"
  | "cash"
  | "subtotal";

export interface PnlMappingLine {
  id: string;
  label: string;
  type: LineType;
  pcg_prefix: string[];
  pcg_exclude: string[];
  sign: SignConvention;
  formula: string | null;
  is_key_subtotal: boolean;
  restatement_flag: string;
}

export interface BfrMappingLine {
  id: string;
  label: string;
  category: BfrCategory;
  pcg_prefix: string[];
  pcg_exclude: string[];
  balance: BalanceMethod;
  bfr_sign: BfrSign;
  formula: string | null;
  linked_ratio: string | null;
  /** M&A/TS flag: "reclass_review" = needs analyst review for op/non-op split */
  restatement_flag?: string;
}

export interface NetDebtMappingLine {
  id: string;
  label: string;
  category: NetDebtCategory;
  pcg_prefix: string[];
  balance: BalanceMethod;
  sign_in_net_debt: string;
  formula: string | null;
  is_manual: boolean;
}

// --- Computed Results ---

/** Single ledger entry for full journal drill-down */
export interface EntryDetail {
  journalCode: string;
  journalLib: string;
  ecritureNum: string;
  ecritureDate: Date;
  pieceRef: string;
  ecritureLib: string;
  compteNum: string;
  compteLib: string;
  debit: number;
  credit: number;
}

export interface AccountDetail {
  compteNum: string;
  compteLib: string;
  debit: number;
  credit: number;
  solde: number;
  entryCount: number;
}

export interface PnlLineResult {
  id: string;
  label: string;
  type: LineType;
  amount: number;
  is_key_subtotal: boolean;
  restatement_flag: string;
  details: AccountDetail[];
  entries: EntryDetail[];
}

export interface BfrLineResult {
  id: string;
  label: string;
  category: BfrCategory;
  bfr_sign: BfrSign;
  amount: number;
  linked_ratio: string | null;
  details: AccountDetail[];
  /** M&A/TS flag: signals analyst review needed */
  restatement_flag?: string;
}

export interface BfrMonthResult {
  month: string; // "YYYY-MM"
  lines: BfrLineResult[];
  operatingAssets: number;
  operatingLiabilities: number;
  operatingBfr: number;
}

export interface KpiMappingLine {
  id: string;
  name: string;
  category: string;
  formula: string;
  unit: string;
  sector_relevance: string[];
  benchmark: string;
  alert_below: number | null;
  alert_above: number | null;
}

export interface KpiResult {
  id: string;
  name: string;
  category: string;
  value: number | null;
  unit: string;
  formula: string;
  benchmark: string;
  alert_below: number | null;
  alert_above: number | null;
  isAlert: boolean;
}

// --- Anglo-Saxon P&L Reclassification ---

export type AngloSaxonLineType = "source" | "subtotal";

export interface AngloSaxonMappingLine {
  id: string;
  label: string;
  label_fr: string;
  type: AngloSaxonLineType;
  /** For source lines: PL_xxx IDs to aggregate */
  source_ids: string[];
  /** Sign multiplier per source_id (+1 or -1) */
  source_signs: number[];
  /** For subtotals: formula referencing AS_xxx IDs */
  formula: string | null;
  is_key_subtotal: boolean;
}

export interface AngloSaxonLineResult {
  id: string;
  label: string;
  label_fr: string;
  type: AngloSaxonLineType;
  amount: number;
  is_key_subtotal: boolean;
  details: AccountDetail[];
  entries: EntryDetail[];
}

export interface AnalysisResult {
  companyId: string;
  companyName: string;
  companyType: CompanyType;
  companySector: CompanySector;
  fiscalYear: string;
  entryCount: number;
  pnl: PnlLineResult[];
  angloSaxonPnl: AngloSaxonLineResult[];
  bfrMonthly: BfrMonthResult[];
  kpis: KpiResult[];
  unmappedAccounts: { compteNum: string; compteLib: string; debit: number; credit: number }[];
}

// --- Multi-Year ---

export interface MultiYearAnalysisResult {
  companyId: string;
  companyName: string;
  companyType: CompanyType;
  companySector: CompanySector;
  yearResults: AnalysisResult[];
}

// --- Workflow ---

export type AnalysisStep = "scope" | "processing" | "results";

export interface ParseResult {
  entries: FecEntry[];
  errors: string[];
  warnings: string[];
}
