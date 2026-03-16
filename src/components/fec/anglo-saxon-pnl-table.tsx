"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LedgerModal } from "./ledger-modal";
import { formatAmountK, formatVariationAmount, formatVariationPercent } from "@/lib/fec/format";
import type { AngloSaxonLineResult, AnalysisResult } from "@/lib/fec/types";

interface AngloSaxonPnlTableProps {
  yearResults: AnalysisResult[];
}

/** Key subtotals that get section breaks above them */
const SECTION_BREAKS = new Set([
  "AS_030", "AS_070", "AS_100", "AS_120", "AS_160",
]);

export function AngloSaxonPnlTable({ yearResults }: AngloSaxonPnlTableProps) {
  const [modalLine, setModalLine] = useState<AngloSaxonLineResult | null>(null);

  if (yearResults.length === 0) return null;

  const isMultiYear = yearResults.length > 1;
  const latestResult = yearResults[yearResults.length - 1];
  const prevResult = yearResults.length >= 2 ? yearResults[yearResults.length - 2] : null;

  // Build lookup maps per year
  const yearLookups = yearResults.map((yr) => {
    const map = new Map<string, AngloSaxonLineResult>();
    for (const line of yr.angloSaxonPnl) map.set(line.id, line);
    return map;
  });

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">
            P&L — Format M&A
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#12121a] z-10">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-2 px-4 text-left text-xs font-medium text-[#8b8b9e] min-w-[200px]">
                    Line Item
                  </th>
                  {yearResults.map((yr) => (
                    <th key={yr.fiscalYear} className="py-2 px-3 text-right text-xs font-medium text-[#8b8b9e] whitespace-nowrap">
                      {yr.fiscalYear} (k€)
                    </th>
                  ))}
                  {isMultiYear && (
                    <>
                      <th className="py-2 px-3 text-right text-xs font-medium text-[#52526b] whitespace-nowrap">
                        Var €
                      </th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-[#52526b] whitespace-nowrap">
                        Var %
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {latestResult.angloSaxonPnl.map((line) => {
                  const isKey = line.is_key_subtotal;
                  const isSubtotal = line.type === "subtotal";
                  const isClickable = line.entries.length > 0 || line.details.length > 0;
                  const hasSectionBreak = SECTION_BREAKS.has(line.id);

                  // Variation between last two years
                  const latestAmount = yearLookups[yearLookups.length - 1].get(line.id)?.amount ?? 0;
                  const prevAmount = prevResult ? (yearLookups[yearLookups.length - 2].get(line.id)?.amount ?? 0) : 0;
                  const varAbsolute = latestAmount - prevAmount;
                  const varPercent = prevAmount !== 0 ? ((latestAmount - prevAmount) / Math.abs(prevAmount)) * 100 : null;

                  return (
                    <tr
                      key={line.id}
                      onClick={isClickable ? () => setModalLine(line) : undefined}
                      className={`
                        border-b transition-colors
                        ${isKey ? "bg-white/[0.06] border-white/[0.08]" : "border-white/[0.04]"}
                        ${isSubtotal && !isKey ? "bg-white/[0.03]" : ""}
                        ${isClickable ? "cursor-pointer hover:bg-white/[0.04]" : ""}
                        ${hasSectionBreak ? "border-t-2 border-t-white/[0.08]" : ""}
                      `}
                    >
                      <td
                        className={`py-1.5 px-4 ${
                          isKey
                            ? "font-bold text-white"
                            : isSubtotal
                            ? "font-semibold text-[#c0c0d0]"
                            : "text-[#8b8b9e]"
                        } ${!isSubtotal && !isKey ? "pl-8" : ""}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {isClickable && (
                            <ChevronRight className="h-3 w-3 text-[#52526b] shrink-0" />
                          )}
                          <span>
                            {line.label}
                            <span className="ml-2 text-[10px] text-[#52526b] font-normal">
                              {line.label_fr}
                            </span>
                          </span>
                        </span>
                      </td>
                      {yearResults.map((yr, idx) => {
                        const amount = yearLookups[idx].get(line.id)?.amount ?? 0;
                        const isNegative = amount < 0;
                        return (
                          <td
                            key={yr.fiscalYear}
                            className={`py-1.5 px-3 text-right font-mono text-xs whitespace-nowrap ${
                              isKey
                                ? "font-bold text-white"
                                : isSubtotal
                                ? "font-semibold text-[#c0c0d0]"
                                : "text-[#8b8b9e]"
                            } ${isNegative ? "text-red-400" : ""}`}
                          >
                            {amount === 0 && !isSubtotal
                              ? "—"
                              : formatAmountK(amount)}
                          </td>
                        );
                      })}
                      {isMultiYear && (
                        <>
                          <td className={`py-1.5 px-3 text-right font-mono text-xs whitespace-nowrap ${varAbsolute < 0 ? "text-red-400" : varAbsolute > 0 ? "text-emerald-400" : "text-[#52526b]"}`}>
                            {!isSubtotal && latestAmount === 0 && prevAmount === 0
                              ? "—"
                              : formatVariationAmount(varAbsolute)}
                          </td>
                          <td className={`py-1.5 px-3 text-right font-mono text-xs whitespace-nowrap ${(varPercent ?? 0) < 0 ? "text-red-400" : (varPercent ?? 0) > 0 ? "text-emerald-400" : "text-[#52526b]"}`}>
                            {!isSubtotal && latestAmount === 0 && prevAmount === 0
                              ? "—"
                              : formatVariationPercent(varPercent)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ledger drill-down modal */}
      {modalLine && (
        <LedgerModal
          open={!!modalLine}
          onClose={() => setModalLine(null)}
          title={`${modalLine.label} — ${modalLine.label_fr}`}
          entries={modalLine.entries}
        />
      )}
    </>
  );
}
