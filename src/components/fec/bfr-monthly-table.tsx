"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmountK, formatMonth } from "@/lib/fec/format";
import type { AnalysisResult, BfrMonthResult } from "@/lib/fec/types";

interface BfrMonthlyTableProps {
  open: boolean;
  onClose: () => void;
  yearResults: AnalysisResult[];
}

/** Row definition for the monthly BFR table */
interface TableRow {
  id: string;
  label: string;
  isBold?: boolean;
  isHighlight?: boolean;
  getValue: (m: BfrMonthResult) => number;
}

const TABLE_ROWS: TableRow[] = [
  {
    id: "operating_assets",
    label: "Actif circulant opérationnel",
    isBold: true,
    getValue: (m) => m.operatingAssets,
  },
  {
    id: "operating_liabilities",
    label: "Passif circulant opérationnel",
    isBold: true,
    getValue: (m) => m.operatingLiabilities,
  },
  {
    id: "operating_bfr",
    label: "BFR Opérationnel",
    isBold: true,
    isHighlight: true,
    getValue: (m) => m.operatingBfr,
  },
];

export function BfrMonthlyTable({ open, onClose, yearResults }: BfrMonthlyTableProps) {
  if (yearResults.length === 0) return null;

  // Build detailed rows from the BFR lines of the latest year
  const latestResult = yearResults[yearResults.length - 1];
  const sampleMonth = latestResult.bfrMonthly[0];
  if (!sampleMonth) return null;

  // Build line-level rows grouped by category
  const assetLines = sampleMonth.lines.filter((l) => l.category === "operating_asset");
  const liabilityLines = sampleMonth.lines.filter((l) => l.category === "operating_liability");

  // Build all rows for the table
  const rows: TableRow[] = [];

  // Asset detail lines
  for (const line of assetLines) {
    rows.push({
      id: `asset_${line.id}`,
      label: line.label,
      getValue: (m) => {
        const found = m.lines.find((l) => l.id === line.id);
        return found ? found.amount : 0;
      },
    });
  }

  // Asset subtotal
  rows.push({
    id: "subtotal_assets",
    label: "Total Actif Circulant",
    isBold: true,
    getValue: (m) => m.operatingAssets,
  });

  // Liability detail lines
  for (const line of liabilityLines) {
    rows.push({
      id: `liability_${line.id}`,
      label: line.label,
      getValue: (m) => {
        const found = m.lines.find((l) => l.id === line.id);
        return found ? found.amount : 0;
      },
    });
  }

  // Liability subtotal
  rows.push({
    id: "subtotal_liabilities",
    label: "Total Passif Circulant",
    isBold: true,
    getValue: (m) => m.operatingLiabilities,
  });

  // BFR line
  rows.push({
    id: "bfr_result",
    label: "BFR Opérationnel",
    isBold: true,
    isHighlight: true,
    getValue: (m) => m.operatingBfr,
  });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base text-white">
            BFR Opérationnel — Détail Mensuel
          </DialogTitle>
          <p className="text-xs text-[#8b8b9e]">
            Décomposition mois par mois du besoin en fonds de roulement
          </p>
        </DialogHeader>

        <div className="overflow-auto flex-1 -mx-4 px-4">
          {yearResults.map((yr) => (
            <div key={yr.fiscalYear} className="mb-6">
              {yearResults.length > 1 && (
                <h3 className="text-sm font-semibold text-[#e040fb] mb-2">
                  Exercice {yr.fiscalYear}
                </h3>
              )}
              <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#12121a]">
                      <th className="sticky left-0 z-10 bg-[#12121a] text-left py-2 px-3 text-[#8b8b9e] font-medium min-w-[200px]">
                        Poste
                      </th>
                      {yr.bfrMonthly.map((m) => (
                        <th
                          key={m.month}
                          className="text-right py-2 px-3 text-[#8b8b9e] font-medium min-w-[90px]"
                        >
                          {formatMonth(m.month)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => {
                      const isSubtotal = row.isBold && !row.isHighlight;
                      const isBfr = row.isHighlight;

                      return (
                        <tr
                          key={row.id}
                          className={`
                            border-t border-white/[0.04] transition-colors
                            ${isBfr ? "bg-gradient-to-r from-[#e040fb]/10 to-[#a78bfa]/10" : ""}
                            ${isSubtotal ? "bg-white/[0.03]" : ""}
                            ${!isBfr && !isSubtotal ? "hover:bg-white/[0.03]" : ""}
                          `}
                        >
                          <td
                            className={`
                              sticky left-0 z-10 py-2 px-3
                              ${isBfr ? "bg-gradient-to-r from-[#e040fb]/10 to-[#a78bfa]/10 font-bold text-white" : ""}
                              ${isSubtotal ? "bg-[#0a0a0f] font-semibold text-[#c0c0d0]" : ""}
                              ${!isBfr && !isSubtotal ? "bg-[#0a0a0f] text-[#8b8b9e] pl-6" : ""}
                            `}
                          >
                            {row.label}
                          </td>
                          {yr.bfrMonthly.map((m) => {
                            const value = row.getValue(m);
                            return (
                              <td
                                key={m.month}
                                className={`
                                  py-2 px-3 text-right font-mono
                                  ${value < 0 ? "text-red-400" : ""}
                                  ${isBfr ? "font-bold text-white" : ""}
                                  ${isSubtotal ? "font-semibold text-[#c0c0d0]" : ""}
                                  ${!isBfr && !isSubtotal ? "text-[#8b8b9e]" : ""}
                                `}
                              >
                                {value === 0 ? "—" : formatAmountK(value)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
