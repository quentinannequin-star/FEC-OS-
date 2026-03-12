// ============================================================
// FEC Analyzer — FEC File Parser
// Parses DGFiP-compliant FEC files (Article A47 A-1 du LPF)
// ============================================================

import type { FecEntry, ParseResult } from "./types";

/** Expected FEC columns in order */
const FEC_COLUMNS = [
  "JournalCode",
  "JournalLib",
  "EcritureNum",
  "EcritureDate",
  "CompteNum",
  "CompteLib",
  "CompAuxNum",
  "CompAuxLib",
  "PieceRef",
  "PieceDate",
  "EcritureLib",
  "Debit",
  "Credit",
  "EcrtureLet",
  "DateLet",
  "ValidDate",
  "Montantdevise",
  "Idevise",
] as const;

/** Minimum required columns for a valid FEC */
const REQUIRED_COLUMNS = [
  "JournalCode",
  "EcritureDate",
  "CompteNum",
  "Debit",
  "Credit",
];

/**
 * Parse a French number string to a JavaScript number.
 * Handles: "1 234 567,89" → 1234567.89
 * Handles: "1234.56" (already decimal point)
 * Handles: "" or null → 0
 */
function parseFrenchNumber(value: string): number {
  if (!value || value.trim() === "") return 0;
  // Remove non-breaking spaces, regular spaces, and other whitespace
  let cleaned = value.replace(/[\s\u00A0\u202F]/g, "");
  // If comma is present, it's the decimal separator
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a FEC date string.
 * Supports: "YYYYMMDD" (standard DGFiP) and "DD/MM/YYYY" (alternative)
 */
function parseFecDate(value: string): Date {
  if (!value || value.trim() === "") return new Date(0);

  const trimmed = value.trim();

  // Format YYYYMMDD (standard)
  if (/^\d{8}$/.test(trimmed)) {
    const year = parseInt(trimmed.substring(0, 4), 10);
    const month = parseInt(trimmed.substring(4, 6), 10) - 1;
    const day = parseInt(trimmed.substring(6, 8), 10);
    return new Date(year, month, day);
  }

  // Format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(0);
}

/**
 * Detect the separator used in the FEC file (tab, pipe, or semicolon).
 * Analyzes the header row to determine the separator.
 */
function detectSeparator(headerLine: string): string {
  const separators = ["\t", "|", ";"];
  let bestSep = "\t";
  let bestCount = 0;

  for (const sep of separators) {
    const count = headerLine.split(sep).length;
    if (count > bestCount) {
      bestCount = count;
      bestSep = sep;
    }
  }

  return bestSep;
}

/**
 * Normalize header column names to match expected FEC columns.
 * Handles BOM characters, whitespace, and case variations.
 */
function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "") // Remove BOM
    .trim()
    .replace(/['"]/g, ""); // Remove quotes
}

/**
 * Read a File as text, trying UTF-8 first then Windows-1252.
 */
async function readFileAsText(file: File): Promise<string> {
  // Try UTF-8 first
  try {
    const text = await file.text();
    // Check if it looks valid (no replacement characters)
    if (!text.includes("\uFFFD")) {
      return text;
    }
  } catch {
    // Fall through to Windows-1252
  }

  // Fallback: Windows-1252
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder("windows-1252");
  return decoder.decode(buffer);
}

/**
 * Build a column index map from the header row.
 * Maps expected FEC column names to their index in the file.
 */
function buildColumnMap(
  headerColumns: string[]
): { map: Map<string, number>; errors: string[] } {
  const map = new Map<string, number>();
  const errors: string[] = [];
  const normalizedHeaders = headerColumns.map(normalizeHeader);

  for (const col of FEC_COLUMNS) {
    // Case-insensitive match
    const idx = normalizedHeaders.findIndex(
      (h) => h.toLowerCase() === col.toLowerCase()
    );
    if (idx !== -1) {
      map.set(col, idx);
    }
  }

  // Check required columns
  for (const req of REQUIRED_COLUMNS) {
    if (!map.has(req)) {
      errors.push(`Colonne obligatoire manquante : ${req}`);
    }
  }

  return { map, errors };
}

/**
 * Parse a single row of FEC data into a FecEntry.
 */
function parseRow(
  columns: string[],
  colMap: Map<string, number>
): FecEntry {
  const get = (col: string): string => {
    const idx = colMap.get(col);
    if (idx === undefined || idx >= columns.length) return "";
    return columns[idx].replace(/^["']|["']$/g, "").trim();
  };

  return {
    JournalCode: get("JournalCode").toUpperCase(),
    JournalLib: get("JournalLib"),
    EcritureNum: get("EcritureNum"),
    EcritureDate: parseFecDate(get("EcritureDate")),
    CompteNum: get("CompteNum").replace(/\s/g, ""),
    CompteLib: get("CompteLib"),
    CompAuxNum: get("CompAuxNum"),
    CompAuxLib: get("CompAuxLib"),
    PieceRef: get("PieceRef"),
    PieceDate: parseFecDate(get("PieceDate")),
    EcritureLib: get("EcritureLib"),
    Debit: parseFrenchNumber(get("Debit")),
    Credit: parseFrenchNumber(get("Credit")),
    EcrtureLet: get("EcrtureLet"),
    DateLet: get("DateLet"),
    ValidDate: get("ValidDate"),
    Montantdevise: parseFrenchNumber(get("Montantdevise")),
    Idevise: get("Idevise"),
  };
}

/**
 * Main parser function.
 * Reads a FEC file and returns typed entries with validation errors/warnings.
 */
export async function parseFecFile(file: File): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entries: FecEntry[] = [];

  // Validate file extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "txt" && ext !== "csv") {
    errors.push(`Format de fichier non supporté : .${ext}. Utilisez .txt ou .csv`);
    return { entries, errors, warnings };
  }

  // Read file content
  let text: string;
  try {
    text = await readFileAsText(file);
  } catch (e) {
    errors.push(`Erreur de lecture du fichier : ${e instanceof Error ? e.message : "Erreur inconnue"}`);
    return { entries, errors, warnings };
  }

  // Split into lines (handle different line endings)
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    errors.push("Le fichier est vide ou ne contient qu'un en-tête");
    return { entries, errors, warnings };
  }

  // Detect separator from header
  const separator = detectSeparator(lines[0]);

  // Parse header
  const headerColumns = lines[0].split(separator);
  const { map: colMap, errors: headerErrors } = buildColumnMap(headerColumns);

  if (headerErrors.length > 0) {
    errors.push(...headerErrors);
    return { entries, errors, warnings };
  }

  // Parse data rows
  let parseErrorCount = 0;
  const maxParseErrors = 50;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;

    const columns = line.split(separator);

    try {
      const entry = parseRow(columns, colMap);

      // Basic validation
      if (!entry.CompteNum) {
        parseErrorCount++;
        if (parseErrorCount <= maxParseErrors) {
          warnings.push(`Ligne ${i + 1} : CompteNum vide, ligne ignorée`);
        }
        continue;
      }

      if (entry.EcritureDate.getTime() === 0) {
        parseErrorCount++;
        if (parseErrorCount <= maxParseErrors) {
          warnings.push(`Ligne ${i + 1} : Date invalide, ligne ignorée`);
        }
        continue;
      }

      entries.push(entry);
    } catch (e) {
      parseErrorCount++;
      if (parseErrorCount <= maxParseErrors) {
        warnings.push(
          `Ligne ${i + 1} : Erreur de parsing — ${e instanceof Error ? e.message : "Erreur inconnue"}`
        );
      }
    }
  }

  if (parseErrorCount > maxParseErrors) {
    warnings.push(
      `... et ${parseErrorCount - maxParseErrors} autres erreurs de parsing`
    );
  }

  // Summary
  if (entries.length === 0) {
    errors.push("Aucune écriture valide trouvée dans le fichier");
  } else {
    // Detect fiscal year
    const dates = entries.map((e) => e.EcritureDate.getTime()).filter((t) => t > 0);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    warnings.push(
      `${entries.length.toLocaleString("fr-FR")} écritures chargées — période du ${minDate.toLocaleDateString("fr-FR")} au ${maxDate.toLocaleDateString("fr-FR")}`
    );

    // Check debit/credit balance
    const totalDebit = entries.reduce((sum, e) => sum + e.Debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.Credit, 0);
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      warnings.push(
        `⚠ Déséquilibre débit/crédit de ${diff.toFixed(2)} € (Débit: ${totalDebit.toFixed(2)}, Crédit: ${totalCredit.toFixed(2)})`
      );
    }
  }

  return { entries, errors, warnings };
}
