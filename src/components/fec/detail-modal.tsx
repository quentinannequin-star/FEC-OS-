"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpDown } from "lucide-react";
import { formatAmountExact } from "@/lib/fec/format";
import type { AccountDetail } from "@/lib/fec/types";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  details: AccountDetail[];
}

type SortKey = "compteNum" | "compteLib" | "debit" | "credit" | "solde";
type SortDir = "asc" | "desc";

export function DetailModal({ open, onClose, title, details }: DetailModalProps) {
  const [sortKey, setSortKey] = useState<SortKey>("compteNum");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...details].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "compteNum" || sortKey === "compteLib") {
      return mul * a[sortKey].localeCompare(b[sortKey]);
    }
    return mul * (a[sortKey] - b[sortKey]);
  });

  const totalDebit = details.reduce((s, d) => s + d.debit, 0);
  const totalCredit = details.reduce((s, d) => s + d.credit, 0);
  const totalSolde = details.reduce((s, d) => s + d.solde, 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Table */}
        <div className="overflow-auto flex-1 -mx-4 px-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <ThHeader
                    label="Compte"
                    sortKey="compteNum"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <ThHeader
                    label="Libellé"
                    sortKey="compteLib"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="text-left"
                  />
                  <ThHeader
                    label="Débit"
                    sortKey="debit"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="text-right"
                  />
                  <ThHeader
                    label="Crédit"
                    sortKey="credit"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="text-right"
                  />
                  <ThHeader
                    label="Solde"
                    sortKey="solde"
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    className="text-right"
                  />
                  <th className="py-2 px-2 text-right text-xs font-medium text-zinc-400">
                    Nb éc.
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((detail) => (
                  <tr
                    key={detail.compteNum}
                    className="border-b border-zinc-50 hover:bg-zinc-50"
                  >
                    <td className="py-1.5 px-2 font-mono text-xs text-zinc-700">
                      {detail.compteNum}
                    </td>
                    <td className="py-1.5 px-2 text-zinc-600 max-w-[200px] truncate">
                      {detail.compteLib}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-xs">
                      {detail.debit > 0 ? formatAmountExact(detail.debit) : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-xs">
                      {detail.credit > 0 ? formatAmountExact(detail.credit) : "—"}
                    </td>
                    <td
                      className={`py-1.5 px-2 text-right font-mono text-xs font-medium ${
                        detail.solde < 0 ? "text-red-600" : "text-zinc-900"
                      }`}
                    >
                      {formatAmountExact(detail.solde)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-xs text-zinc-400">
                      {detail.entryCount}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals */}
              <tfoot>
                <tr className="border-t border-zinc-200 font-medium">
                  <td className="py-2 px-2 text-xs text-zinc-500">Total</td>
                  <td className="py-2 px-2 text-xs text-zinc-500">
                    {details.length} compte{details.length > 1 ? "s" : ""}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs">
                    {formatAmountExact(totalDebit)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-xs">
                    {formatAmountExact(totalCredit)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-mono text-xs font-bold ${
                      totalSolde < 0 ? "text-red-600" : "text-zinc-900"
                    }`}
                  >
                    {formatAmountExact(totalSolde)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>

            {details.length === 0 && (
              <p className="text-center text-sm text-zinc-400 py-8">
                Aucun mouvement sur cette ligne
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ThHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = current === sortKey;
  return (
    <th
      className={`py-2 px-2 text-xs font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-700 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? "text-zinc-700" : "text-zinc-300"}`}
        />
        {isActive && (
          <span className="text-[10px] text-zinc-400">
            {dir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );
}
