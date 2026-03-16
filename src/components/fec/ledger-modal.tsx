"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search } from "lucide-react";
import { formatAmountExact } from "@/lib/fec/format";
import type { EntryDetail } from "@/lib/fec/types";

interface LedgerModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  entries: EntryDetail[];
}

type SortKey = "ecritureDate" | "journalCode" | "pieceRef" | "compteNum" | "ecritureLib" | "debit" | "credit";
type SortDir = "asc" | "desc";

function formatDate(d: Date): string {
  if (!d || d.getTime() === 0) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function LedgerModal({ open, onClose, title, entries }: LedgerModalProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ecritureDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState("");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    if (!filter) return entries;
    const lower = filter.toLowerCase();
    return entries.filter(
      (e) =>
        e.compteNum.toLowerCase().includes(lower) ||
        e.compteLib.toLowerCase().includes(lower) ||
        e.journalCode.toLowerCase().includes(lower) ||
        e.ecritureLib.toLowerCase().includes(lower) ||
        e.pieceRef.toLowerCase().includes(lower)
    );
  }, [entries, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortKey === "ecritureDate") {
        return mul * (a.ecritureDate.getTime() - b.ecritureDate.getTime());
      }
      if (sortKey === "debit" || sortKey === "credit") {
        return mul * (a[sortKey] - b[sortKey]);
      }
      return mul * ((a[sortKey] ?? "").localeCompare(b[sortKey] ?? ""));
    });
  }, [filtered, sortKey, sortDir]);

  const totalDebit = filtered.reduce((s, e) => s + e.debit, 0);
  const totalCredit = filtered.reduce((s, e) => s + e.credit, 0);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <p className="text-xs text-[#8b8b9e]">
            {filtered.length} écriture{filtered.length > 1 ? "s" : ""}
            {filter && ` (filtrées sur ${entries.length})`}
          </p>
        </DialogHeader>

        {/* Search filter */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#52526b]" />
          <Input
            placeholder="Filtrer par compte, journal, libellé, pièce..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 h-8 text-xs"
          />
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 -mx-4 px-4">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#12121a] z-10">
              <tr className="border-b border-white/[0.08]">
                <ThHeader label="Date" sortKey="ecritureDate" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThHeader label="Journal" sortKey="journalCode" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThHeader label="Pièce" sortKey="pieceRef" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThHeader label="Compte" sortKey="compteNum" current={sortKey} dir={sortDir} onSort={handleSort} />
                <ThHeader label="Libellé" sortKey="ecritureLib" current={sortKey} dir={sortDir} onSort={handleSort} className="text-left" />
                <ThHeader label="Débit" sortKey="debit" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
                <ThHeader label="Crédit" sortKey="credit" current={sortKey} dir={sortDir} onSort={handleSort} className="text-right" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, idx) => (
                <tr
                  key={`${entry.ecritureNum}-${entry.compteNum}-${idx}`}
                  className="border-b border-white/[0.04] hover:bg-white/[0.04]"
                >
                  <td className="py-1 px-2 font-mono text-[#8b8b9e] whitespace-nowrap">
                    {formatDate(entry.ecritureDate)}
                  </td>
                  <td className="py-1 px-2 text-[#8b8b9e]">
                    {entry.journalCode}
                  </td>
                  <td className="py-1 px-2 text-[#52526b] max-w-[80px] truncate">
                    {entry.pieceRef}
                  </td>
                  <td className="py-1 px-2 font-mono text-[#c0c0d0]">
                    {entry.compteNum}
                  </td>
                  <td className="py-1 px-2 text-[#8b8b9e] max-w-[250px] truncate">
                    {entry.ecritureLib || entry.compteLib}
                  </td>
                  <td className="py-1 px-2 text-right font-mono">
                    {entry.debit > 0 ? formatAmountExact(entry.debit) : "—"}
                  </td>
                  <td className="py-1 px-2 text-right font-mono">
                    {entry.credit > 0 ? formatAmountExact(entry.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/[0.08] font-medium">
                <td colSpan={5} className="py-2 px-2 text-[#8b8b9e]">
                  Total ({filtered.length} écritures)
                </td>
                <td className="py-2 px-2 text-right font-mono">
                  {formatAmountExact(totalDebit)}
                </td>
                <td className="py-2 px-2 text-right font-mono">
                  {formatAmountExact(totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>

          {filtered.length === 0 && (
            <p className="text-center text-sm text-[#52526b] py-8">
              Aucune écriture
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
      className={`py-2 px-2 text-xs font-medium text-[#8b8b9e] cursor-pointer select-none hover:text-white ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${isActive ? "text-white" : "text-[#52526b]"}`}
        />
        {isActive && (
          <span className="text-[10px] text-[#52526b]">
            {dir === "asc" ? "\u2191" : "\u2193"}
          </span>
        )}
      </span>
    </th>
  );
}
