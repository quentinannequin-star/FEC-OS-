// ============================================================
// FEC Analyzer — Formatting Utilities
// ============================================================

const frFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const frFormatterDecimals = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const frFormatterPercent = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Format amount in euros: "1 234 567 €" */
export function formatAmount(value: number): string {
  return frFormatter.format(Math.round(value)) + " €";
}

/** Format amount in k€: "1 235 k€" */
export function formatAmountK(value: number): string {
  return frFormatter.format(Math.round(value / 1000)) + " k€";
}

/** Format amount with 2 decimals: "1 234 567,89 €" */
export function formatAmountExact(value: number): string {
  return frFormatterDecimals.format(value) + " €";
}

/** Format percentage: "12,5 %" */
export function formatPercent(value: number): string {
  return frFormatterPercent.format(value) + " %";
}

/** Format days: "45 j" */
export function formatDays(value: number): string {
  return frFormatter.format(Math.round(value)) + " j";
}

/** Format ratio: "2,3x" */
export function formatMultiple(value: number): string {
  return frFormatterPercent.format(value) + "x";
}

/** Format file size: "12,5 Mo" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Format month label: "Jan 2023", "Fév 2023" */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const monthNames = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

/** Short month label: "Jan", "Fév" */
export function formatMonthShort(yearMonth: string): string {
  const month = yearMonth.split("-")[1];
  const monthNames = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
  ];
  return monthNames[parseInt(month, 10) - 1];
}
