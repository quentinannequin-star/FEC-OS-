"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailModal } from "./detail-modal";
import { formatAmountK } from "@/lib/fec/format";
import type { PnlLineResult } from "@/lib/fec/types";

interface PnlTableProps {
  lines: PnlLineResult[];
}

/** Lines that serve as section separators / visual grouping */
const SECTION_BREAKS = new Set([
  "PL_030", // CA
  "PL_070", // Production
  "PL_140", // Consommation
  "PL_150", // VA
  "PL_180", // EBITDA
  "PL_240", // EBIT
  "PL_270", // Résultat financier
  "PL_280", // RCAI
  "PL_310", // Résultat exceptionnel
  "PL_340", // RN
]);

/** Lines to hide by default (control lines) */
const HIDDEN_LINES = new Set(["PL_900", "PL_910"]);

export function PnlTable({ lines }: PnlTableProps) {
  const [modalLine, setModalLine] = useState<PnlLineResult | null>(null);

  const visibleLines = lines.filter((l) => !HIDDEN_LINES.has(l.id));

  // Check control line
  const controlLine = lines.find((l) => l.id === "PL_900");
  const rnLine = lines.find((l) => l.id === "PL_340");
  const hasControlDiff =
    controlLine && rnLine && Math.abs(controlLine.amount - rnLine.amount) > 1;

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-zinc-900">
            Compte de Résultat — SIG M&A
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-zinc-200">
                  <th className="py-2 px-4 text-left text-xs font-medium text-zinc-500 w-[60%]">
                    Libellé
                  </th>
                  <th className="py-2 px-4 text-right text-xs font-medium text-zinc-500">
                    Montant (k€)
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleLines.map((line) => {
                  const isKey = line.is_key_subtotal;
                  const isSubtotal = line.type === "subtotal";
                  const isClickable = line.type === "account" && line.details.length > 0;
                  const hasSectionBreak = SECTION_BREAKS.has(line.id);
                  const isNegative = line.amount < 0;

                  return (
                    <tr
                      key={line.id}
                      onClick={isClickable ? () => setModalLine(line) : undefined}
                      className={`
                        border-b transition-colors
                        ${isKey ? "bg-zinc-100 border-zinc-200" : "border-zinc-50"}
                        ${isSubtotal && !isKey ? "bg-zinc-50/50" : ""}
                        ${isClickable ? "cursor-pointer hover:bg-zinc-50" : ""}
                        ${hasSectionBreak ? "border-t border-t-zinc-200" : ""}
                      `}
                    >
                      <td
                        className={`py-1.5 px-4 ${
                          isKey
                            ? "font-bold text-zinc-900"
                            : isSubtotal
                            ? "font-semibold text-zinc-800"
                            : "text-zinc-600"
                        } ${!isSubtotal && !isKey ? "pl-8" : ""}`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {isClickable && (
                            <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
                          )}
                          {line.label}
                          {line.restatement_flag !== "none" && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
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
                      <td
                        className={`py-1.5 px-4 text-right font-mono text-xs whitespace-nowrap ${
                          isKey
                            ? "font-bold text-zinc-900"
                            : isSubtotal
                            ? "font-semibold text-zinc-800"
                            : "text-zinc-600"
                        } ${isNegative ? "text-red-600" : ""}`}
                      >
                        {line.amount === 0 && line.type === "account"
                          ? "—"
                          : formatAmountK(line.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Control warning */}
          {hasControlDiff && (
            <div className="mx-4 mb-3 mt-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 font-medium">
                ⚠ Écart de réconciliation détecté
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Résultat net calculé ({formatAmountK(rnLine!.amount)}) ≠ Solde
                compte 12x ({formatAmountK(controlLine!.amount)}). Écart :{" "}
                {formatAmountK(Math.abs(rnLine!.amount - controlLine!.amount))}
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
        />
      )}
    </>
  );
}
