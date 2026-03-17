"use client";

import { useState, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailModal } from "./detail-modal";
import { formatAmountK, formatVariationAmount, formatVariationPercent } from "@/lib/fec/format";
import type { AnalysisResult, LiasseFiscaleLineResult } from "@/lib/fec/types";

// --------------- Constants ---------------

/** Key subtotals — bold + highlighted bg */
const KEY_SUBTOTALS = new Set([
  "LF_040", // CA net
  "LF_100", // Total produits exploitation
  "LF_200", // Total charges exploitation
  "LF_210", // Résultat d'exploitation
  "LF_250", // Résultat courant avant impôts
  "LF_310", // Résultat de l'exercice
]);

/** Section breaks — thicker border-top */
const SECTION_BREAKS = new Set([
  "LF_100", // before charges
  "LF_210", // résultat exploitation
  "LF_250", // résultat courant
  "LF_310", // résultat final
]);

// --------------- Component ---------------

interface LiasseFiscalePnlProps {
  yearResults: AnalysisResult[];
}

export function LiasseFiscalePnl({ yearResults }: LiasseFiscalePnlProps) {
  const [modalLine, setModalLine] = useState<LiasseFiscaleLineResult | null>(null);

  if (yearResults.length === 0) return null;

  const isMultiYear = yearResults.length > 1;
  const latestResult = yearResults[yearResults.length - 1];
  const prevResult = yearResults.length >= 2 ? yearResults[yearResults.length - 2] : null;

  const visibleLines = latestResult.liasseFiscalePnl;

  // Build lookup maps per year
  const yearLookups = useMemo(() => {
    return yearResults.map((yr) => {
      const map = new Map<string, LiasseFiscaleLineResult>();
      for (const line of yr.liasseFiscalePnl) map.set(line.id, line);
      return map;
    });
  }, [yearResults]);

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">
            Compte de Résultat — Liasse Fiscale
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#12121a] z-10">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-2 px-4 text-left text-xs font-medium text-[#8b8b9e] min-w-[200px]">
                    Libellé
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
                {visibleLines.map((line) => {
                  const isKey = KEY_SUBTOTALS.has(line.id);
                  const isSubtotal = line.type === "subtotal";
                  const isClickable = line.type === "account" && line.details.length > 0;
                  const hasSectionBreak = SECTION_BREAKS.has(line.id);

                  // Variation between last two years
                  const latestAmount = yearLookups[yearLookups.length - 1].get(line.id)?.amount ?? 0;
                  const prevAmount = prevResult ? (yearLookups[yearLookups.length - 2].get(line.id)?.amount ?? 0) : 0;
                  const varAbsolute = latestAmount - prevAmount;
                  const varPercent = prevAmount !== 0 ? ((latestAmount - prevAmount) / Math.abs(prevAmount)) * 100 : null;

                  // For the modal, use the latest year's line data
                  const latestLineData = yearLookups[yearLookups.length - 1].get(line.id);

                  return (
                    <tr
                      key={line.id}
                      onClick={isClickable && latestLineData ? () => setModalLine(latestLineData) : undefined}
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
                          {line.label}
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
                            {amount === 0 && line.type === "account"
                              ? "—"
                              : formatAmountK(amount)}
                          </td>
                        );
                      })}
                      {isMultiYear && (
                        <>
                          <td className={`py-1.5 px-3 text-right font-mono text-xs whitespace-nowrap ${varAbsolute < 0 ? "text-red-400" : varAbsolute > 0 ? "text-emerald-400" : "text-[#52526b]"}`}>
                            {line.type === "account" && latestAmount === 0 && prevAmount === 0
                              ? "—"
                              : formatVariationAmount(varAbsolute)}
                          </td>
                          <td className={`py-1.5 px-3 text-right font-mono text-xs whitespace-nowrap ${(varPercent ?? 0) < 0 ? "text-red-400" : (varPercent ?? 0) > 0 ? "text-emerald-400" : "text-[#52526b]"}`}>
                            {line.type === "account" && latestAmount === 0 && prevAmount === 0
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

      {/* Detail modal */}
      {modalLine && (
        <DetailModal
          open={!!modalLine}
          onClose={() => setModalLine(null)}
          title={modalLine.label}
          details={modalLine.details}
          yearDetails={yearResults.map((yr) => {
            const line = yr.liasseFiscalePnl.find((l) => l.id === modalLine.id);
            return { label: yr.fiscalYear, details: line?.details ?? [] };
          })}
        />
      )}
    </>
  );
}
