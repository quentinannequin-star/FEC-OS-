"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailModal } from "./detail-modal";
import { formatAmountK, formatVariationAmount, formatVariationPercent } from "@/lib/fec/format";
import type { PnlLineResult, AnalysisResult } from "@/lib/fec/types";

interface PnlTableProps {
  yearResults: AnalysisResult[];
}

/** Lines that serve as section separators / visual grouping */
const SECTION_BREAKS = new Set([
  "PL_030", "PL_070", "PL_140", "PL_150", "PL_180",
  "PL_240", "PL_270", "PL_280", "PL_310", "PL_340",
]);

/** Lines to hide by default (control lines) */
const HIDDEN_LINES = new Set(["PL_900", "PL_910"]);

export function PnlTable({ yearResults }: PnlTableProps) {
  const [modalLine, setModalLine] = useState<PnlLineResult | null>(null);

  if (yearResults.length === 0) return null;

  const isMultiYear = yearResults.length > 1;
  const latestResult = yearResults[yearResults.length - 1];
  const prevResult = yearResults.length >= 2 ? yearResults[yearResults.length - 2] : null;

  // Use latest year's line structure as reference
  const visibleLines = latestResult.pnl.filter((l) => !HIDDEN_LINES.has(l.id));

  // Build lookup maps per year
  const yearLookups = yearResults.map((yr) => {
    const map = new Map<string, PnlLineResult>();
    for (const line of yr.pnl) map.set(line.id, line);
    return map;
  });

  // Check control line (latest year only)
  const controlLine = latestResult.pnl.find((l) => l.id === "PL_900");
  const rnLine = latestResult.pnl.find((l) => l.id === "PL_340");
  const hasControlDiff =
    controlLine && rnLine && Math.abs(controlLine.amount - rnLine.amount) > 1;

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white">
            Compte de Résultat détaillé
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
                  const isKey = line.is_key_subtotal;
                  const isSubtotal = line.type === "subtotal";
                  const isClickable = line.type === "account" && line.details.length > 0;
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
                        ${hasSectionBreak ? "border-t border-t-white/[0.08]" : ""}
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
                          {line.restatement_flag !== "none" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">
                              {line.restatement_flag === "director_comp" && "Dir."}
                              {line.restatement_flag === "lease_ifrs16" && "IFRS16"}
                              {line.restatement_flag === "one_off" && "One-off"}
                              {line.restatement_flag === "ic_risk" && "IC"}
                              {line.restatement_flag === "cir_reclass" && "CIR"}
                              {line.restatement_flag === "capex_proxy" && "CAPEX"}
                              {line.restatement_flag === "cvae_reclass" && "CVAE"}
                            </span>
                          )}
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

          {/* Control warning */}
          {hasControlDiff && (
            <div className="mx-4 mb-3 mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-300 font-medium">
                ⚠ Écart de réconciliation
              </p>
              <p className="text-xs text-amber-400 mt-0.5">
                Résultat net calculé ({formatAmountK(rnLine!.amount)}) ≠ Solde
                compte 12x ({formatAmountK(controlLine!.amount)}). Écart :{" "}
                {formatAmountK(Math.abs(rnLine!.amount - controlLine!.amount))}
              </p>
              <p className="text-[10px] text-amber-400 mt-1">
                Normal si le FEC est avant affectation du résultat (compte 12x non mouvementé).
              </p>
            </div>
          )}
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
            const line = yr.pnl.find((l) => l.id === modalLine.id);
            return { label: yr.fiscalYear, details: line?.details ?? [] };
          })}
        />
      )}
    </>
  );
}
