"use client";

import { useState, useMemo, Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { DetailModal } from "./detail-modal";
import { formatAmount } from "@/lib/fec/format";
import type { AnalysisResult, LiasseFiscaleLineResult } from "@/lib/fec/types";

// --------------- Constants ---------------

const RESULT_LINES = new Set([
  "LF_040", "LF_100", "LF_200", "LF_210",
  "LF_240", "LF_250", "LF_280", "LF_310",
]);

const FINAL_LINE = "LF_310";

const SECTION_BREAKS = new Set([
  "LF_100", "LF_210", "LF_250", "LF_280",
]);

// --------------- Component ---------------

interface LiasseFiscalePnlProps {
  yearResults: AnalysisResult[];
}

export function LiasseFiscalePnl({ yearResults }: LiasseFiscalePnlProps) {
  const [selectedYearIdx, setSelectedYearIdx] = useState(
    yearResults.length - 1
  );
  const [modalLine, setModalLine] = useState<LiasseFiscaleLineResult | null>(null);

  const showMultiYear = yearResults.length > 1;
  const lines = yearResults[0]?.liasseFiscalePnl ?? [];

  const yearLookups = useMemo(() => {
    return yearResults.map((yr) => {
      const map = new Map<string, LiasseFiscaleLineResult>();
      for (const line of yr.liasseFiscalePnl) {
        map.set(line.id, line);
      }
      return map;
    });
  }, [yearResults]);

  if (lines.length === 0) return null;

  const displayIndices = showMultiYear
    ? yearResults.map((_, i) => i)
    : [selectedYearIdx];

  return (
    <>
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800 px-4 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                COMPTE DE RÉSULTAT — LIASSE FISCALE
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Vue Cerfa standard • Comptes de classe 6 et 7
              </p>
            </div>
            {!showMultiYear && yearResults.length > 1 && (
              <div className="flex gap-1">
                {yearResults.map((yr, idx) => (
                  <button
                    key={yr.fiscalYear}
                    onClick={() => setSelectedYearIdx(idx)}
                    className={`h-7 px-2.5 text-xs rounded-md font-medium transition-colors ${
                      selectedYearIdx === idx
                        ? "bg-slate-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {yr.fiscalYear}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm border-collapse">
            {showMultiYear && (
              <thead className="sticky top-0 bg-slate-900 z-10">
                <tr className="border-b border-slate-700">
                  <th className="text-left text-[10px] text-slate-400 uppercase tracking-wider font-medium px-4 py-2">
                    Libellé
                  </th>
                  {displayIndices.map((idx) => (
                    <th
                      key={idx}
                      className="text-right text-[10px] text-slate-400 uppercase tracking-wider font-medium px-4 py-2 w-[130px]"
                    >
                      {yearResults[idx].fiscalYear}
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            <tbody>
              {lines.map((line) => {
                const isFinal = line.id === FINAL_LINE;
                const isResult = RESULT_LINES.has(line.id);
                const isSubtotal = line.type === "subtotal";
                const hasBreakAfter = SECTION_BREAKS.has(line.id);
                const isClickable = line.type === "account" && line.details.length > 0;

                const amounts = displayIndices.map((idx) => {
                  const l = yearLookups[idx].get(line.id);
                  return l?.amount ?? 0;
                });

                // For the modal, use the latest displayed year's line data
                const latestLineData = yearLookups[displayIndices[displayIndices.length - 1]].get(line.id);

                // Styling
                let rowBg = "";
                let labelStyle = "text-slate-300 pl-6";
                let amountStyle = "text-slate-300 font-mono";
                let borderStyle = "border-b border-slate-800/60";

                if (isFinal) {
                  const lastAmt = amounts[amounts.length - 1];
                  const isBenefice = lastAmt >= 0;
                  rowBg = isBenefice ? "bg-emerald-950/40" : "bg-red-950/40";
                  borderStyle = isBenefice
                    ? "border-b-2 border-emerald-700/50"
                    : "border-b-2 border-red-700/50";
                  labelStyle = "text-white font-bold pl-4";
                  amountStyle = `font-mono font-bold ${isBenefice ? "text-emerald-400" : "text-red-400"}`;
                } else if (isResult) {
                  rowBg = "bg-slate-800/80";
                  borderStyle = "border-b border-slate-700";
                  labelStyle = "text-white text-xs font-semibold pl-4 uppercase tracking-wide";
                  amountStyle = "text-white font-mono font-semibold";
                } else if (isSubtotal) {
                  rowBg = "bg-slate-800/40";
                  borderStyle = "border-b border-slate-700/60";
                  labelStyle = "text-slate-200 text-xs font-medium pl-4 uppercase tracking-wide";
                  amountStyle = "text-slate-200 font-mono font-medium";
                }

                if (hasBreakAfter) {
                  borderStyle = "border-b-2 border-slate-600/70";
                }

                return (
                  <Fragment key={line.id}>
                    <tr
                      className={`${rowBg} ${borderStyle} ${
                        isClickable
                          ? "cursor-pointer hover:bg-white/[0.04] transition-colors"
                          : ""
                      }`}
                      onClick={
                        isClickable && latestLineData
                          ? () => setModalLine(latestLineData)
                          : undefined
                      }
                    >
                      {/* Label */}
                      <td className={`px-4 py-2 ${labelStyle}`}>
                        <span className="inline-flex items-center gap-1.5">
                          {isClickable && (
                            <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
                          )}
                          {line.label}
                        </span>
                      </td>
                      {/* Amounts */}
                      {amounts.map((amt, i) => (
                        <td
                          key={i}
                          className={`px-4 py-2 text-right whitespace-nowrap ${amountStyle}`}
                        >
                          {formatLiasseAmount(amt)}
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal — same as SIG */}
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

/** Format amount for liasse: "1 234 567 €" or "—" for zero */
function formatLiasseAmount(value: number): string {
  if (Math.abs(value) < 0.5) return "—";
  return formatAmount(value);
}
