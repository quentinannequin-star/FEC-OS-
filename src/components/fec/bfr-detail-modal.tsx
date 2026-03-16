"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatAmountExact, formatAmountK } from "@/lib/fec/format";
import type { BfrLineResult, BfrMonthResult } from "@/lib/fec/types";

interface BfrDetailModalProps {
  open: boolean;
  onClose: () => void;
  monthData: BfrMonthResult;
}

/** Grouped BFR categories for display */
const CATEGORIES: {
  key: string;
  label: string;
  filter: (l: BfrLineResult) => boolean;
  subtotalId: string;
}[] = [
  {
    key: "operating_asset",
    label: "Actif circulant opérationnel",
    filter: (l) => l.category === "operating_asset",
    subtotalId: "BFR_200",
  },
  {
    key: "operating_liability",
    label: "Passif circulant opérationnel",
    filter: (l) => l.category === "operating_liability",
    subtotalId: "BFR_210",
  },
  {
    key: "non_operating",
    label: "Hors exploitation",
    filter: (l) => l.category === "non_operating",
    subtotalId: "",
  },
  {
    key: "cash",
    label: "Trésorerie",
    filter: (l) => l.category === "cash",
    subtotalId: "BFR_420",
  },
];

export function BfrDetailModal({ open, onClose, monthData }: BfrDetailModalProps) {
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

  const toggleLine = (id: string) => {
    setExpandedLines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const bfrLine = monthData.lines.find((l) => l.id === "BFR_220");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base">
            BFR détail — {monthData.month}
          </DialogTitle>
          <div className="flex items-center gap-4 text-xs text-[#8b8b9e] mt-1">
            <span>
              Actif circulant :{" "}
              <span className="font-mono font-medium text-[#c0c0d0]">
                {formatAmountK(monthData.operatingAssets)}
              </span>
            </span>
            <span>
              Passif circulant :{" "}
              <span className="font-mono font-medium text-[#c0c0d0]">
                {formatAmountK(monthData.operatingLiabilities)}
              </span>
            </span>
            <span>
              BFR opérationnel :{" "}
              <span className={`font-mono font-bold ${monthData.operatingBfr < 0 ? "text-red-400" : "text-white"}`}>
                {formatAmountK(monthData.operatingBfr)}
              </span>
            </span>
          </div>
        </DialogHeader>

        <div className="overflow-auto flex-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const categoryLines = monthData.lines.filter(cat.filter);
            // Skip empty categories
            if (categoryLines.length === 0 || categoryLines.every((l) => l.amount === 0 && l.details.length === 0)) {
              return null;
            }

            const subtotalLine = cat.subtotalId
              ? monthData.lines.find((l) => l.id === cat.subtotalId)
              : null;

            return (
              <div key={cat.key} className="mb-4">
                {/* Category header */}
                <div className="flex items-center justify-between py-2 px-3 bg-white/[0.06] rounded-t-lg border border-white/[0.08]">
                  <span className="text-xs font-semibold text-[#c0c0d0] uppercase tracking-wide">
                    {cat.label}
                  </span>
                  {subtotalLine && (
                    <span className={`text-xs font-mono font-bold ${subtotalLine.amount < 0 ? "text-red-400" : "text-white"}`}>
                      {formatAmountK(subtotalLine.amount)}
                    </span>
                  )}
                </div>

                {/* Lines in this category */}
                <table className="w-full text-xs border-x border-b border-white/[0.08] rounded-b-lg">
                  <tbody>
                    {categoryLines.map((line) => {
                      const isExpanded = expandedLines.has(line.id);
                      const hasDetails = line.details.length > 0;

                      return (
                        <BfrLineRow
                          key={line.id}
                          line={line}
                          isExpanded={isExpanded}
                          hasDetails={hasDetails}
                          onToggle={() => toggleLine(line.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* BFR Opérationnel summary */}
          {bfrLine && (
            <div className="flex items-center justify-between py-3 px-3 bg-gradient-to-r from-[#e040fb]/20 to-[#a78bfa]/20 border border-[#e040fb]/30 text-white rounded-lg mt-2">
              <span className="text-sm font-bold">BFR Opérationnel</span>
              <span className="text-sm font-mono font-bold">
                {formatAmountK(bfrLine.amount)}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BfrLineRow({
  line,
  isExpanded,
  hasDetails,
  onToggle,
}: {
  line: BfrLineResult;
  isExpanded: boolean;
  hasDetails: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={hasDetails ? onToggle : undefined}
        className={`
          border-b border-white/[0.06] transition-colors
          ${hasDetails ? "cursor-pointer hover:bg-white/[0.04]" : ""}
          ${isExpanded ? "bg-white/[0.04]" : ""}
        `}
      >
        <td className="py-1.5 px-3 text-[#c0c0d0] w-[55%]">
          <span className="inline-flex items-center gap-1.5">
            {hasDetails ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3 text-[#52526b] shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-[#52526b] shrink-0" />
              )
            ) : (
              <span className="w-3" />
            )}
            {line.label}
            {line.linked_ratio && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-[#8b8b9e] font-medium">
                {line.linked_ratio}
              </span>
            )}
          </span>
        </td>
        <td className={`py-1.5 px-3 text-right font-mono whitespace-nowrap ${line.amount < 0 ? "text-red-400" : "text-white"}`}>
          {line.amount === 0 ? "—" : formatAmountK(line.amount)}
        </td>
        <td className="py-1.5 px-3 text-right text-[#52526b] w-[60px]">
          {hasDetails ? `${line.details.length} cpt` : ""}
        </td>
      </tr>

      {/* Expanded account details */}
      {isExpanded && hasDetails && (
        <>
          <tr className="bg-white/[0.03]">
            <td colSpan={3} className="px-0">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[#52526b] uppercase">
                    <th className="py-1 px-3 pl-10 text-left font-medium">Compte</th>
                    <th className="py-1 px-3 text-left font-medium">Libellé</th>
                    <th className="py-1 px-3 text-right font-medium">Débit</th>
                    <th className="py-1 px-3 text-right font-medium">Crédit</th>
                    <th className="py-1 px-3 text-right font-medium">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {line.details.map((detail) => (
                    <tr key={detail.compteNum} className="border-t border-white/[0.04]">
                      <td className="py-1 px-3 pl-10 font-mono text-[#8b8b9e]">
                        {detail.compteNum}
                      </td>
                      <td className="py-1 px-3 text-[#8b8b9e] max-w-[200px] truncate">
                        {detail.compteLib}
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-[#8b8b9e]">
                        {detail.debit > 0 ? formatAmountExact(detail.debit) : "—"}
                      </td>
                      <td className="py-1 px-3 text-right font-mono text-[#8b8b9e]">
                        {detail.credit > 0 ? formatAmountExact(detail.credit) : "—"}
                      </td>
                      <td className={`py-1 px-3 text-right font-mono font-medium ${detail.solde < 0 ? "text-red-400" : "text-[#c0c0d0]"}`}>
                        {formatAmountExact(detail.solde)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        </>
      )}
    </>
  );
}
