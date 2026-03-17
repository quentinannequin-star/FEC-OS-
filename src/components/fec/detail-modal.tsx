"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";
import { formatAmountExact } from "@/lib/fec/format";
import type { AccountDetail, EntryDetail } from "@/lib/fec/types";

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  details: AccountDetail[];
  /** Multi-year support: array of { label, details } per year */
  yearDetails?: { label: string; details: AccountDetail[] }[];
}

type SortKey = "compteNum" | "compteLib" | "debit" | "credit" | "solde";
type SortDir = "asc" | "desc";

function formatDate(d: Date): string {
  if (!d || d.getTime() === 0) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function DetailModal({ open, onClose, title, details, yearDetails }: DetailModalProps) {
  const [sortKey, setSortKey] = useState<SortKey>("compteNum");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedYearIdx, setSelectedYearIdx] = useState(
    yearDetails ? yearDetails.length - 1 : 0
  );
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleAccount = (compteNum: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(compteNum)) {
        next.delete(compteNum);
      } else {
        next.add(compteNum);
      }
      return next;
    });
  };

  // Use year-specific details if available, otherwise fallback to single details
  const activeDetails =
    yearDetails && yearDetails.length > 0
      ? yearDetails[selectedYearIdx]?.details ?? []
      : details;

  const sorted = [...activeDetails].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "compteNum" || sortKey === "compteLib") {
      return mul * a[sortKey].localeCompare(b[sortKey]);
    }
    return mul * (a[sortKey] - b[sortKey]);
  });

  const totalDebit = activeDetails.reduce((s, d) => s + d.debit, 0);
  const totalCredit = activeDetails.reduce((s, d) => s + d.credit, 0);
  const totalSolde = activeDetails.reduce((s, d) => s + d.solde, 0);

  const showYearSelector = yearDetails && yearDetails.length > 1;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {/* Year selector */}
          {showYearSelector && (
            <div className="flex gap-1 mt-2">
              {yearDetails!.map((yd, idx) => (
                <button
                  key={yd.label}
                  onClick={() => setSelectedYearIdx(idx)}
                  className={`h-7 px-2.5 text-xs rounded-md font-medium transition-colors ${
                    selectedYearIdx === idx
                      ? "bg-zinc-200 text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {yd.label}
                </button>
              ))}
            </div>
          )}
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
                  <th className="py-2 px-3 text-right text-xs font-medium text-zinc-400 whitespace-nowrap">
                    Nb éc.
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((detail) => {
                  const hasEntries = detail.entries && detail.entries.length > 0;
                  const isExpanded = expandedAccounts.has(detail.compteNum);

                  return (
                    <AccountRow
                      key={detail.compteNum}
                      detail={detail}
                      hasEntries={!!hasEntries}
                      isExpanded={isExpanded}
                      onToggle={() => toggleAccount(detail.compteNum)}
                    />
                  );
                })}
              </tbody>
              {/* Totals */}
              <tfoot>
                <tr className="border-t border-zinc-200 font-medium">
                  <td className="py-2 px-3 text-xs text-zinc-500">Total</td>
                  <td className="py-2 px-3 text-xs text-zinc-500">
                    {activeDetails.length} compte{activeDetails.length > 1 ? "s" : ""}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xs whitespace-nowrap">
                    {formatAmountExact(totalDebit)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xs whitespace-nowrap">
                    {formatAmountExact(totalCredit)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-mono text-xs font-bold whitespace-nowrap ${
                      totalSolde < 0 ? "text-red-600" : "text-zinc-900"
                    }`}
                  >
                    {formatAmountExact(totalSolde)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>

            {activeDetails.length === 0 && (
              <p className="text-center text-sm text-zinc-400 py-8">
                Aucun mouvement sur cette ligne
              </p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Account row with expandable entries ──

function AccountRow({
  detail,
  hasEntries,
  isExpanded,
  onToggle,
}: {
  detail: AccountDetail;
  hasEntries: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={hasEntries ? onToggle : undefined}
        className={`
          border-b border-zinc-50 transition-colors
          ${hasEntries ? "cursor-pointer hover:bg-zinc-50" : "hover:bg-zinc-50"}
          ${isExpanded ? "bg-zinc-50" : ""}
        `}
      >
        <td className="py-1.5 px-3 font-mono text-xs text-zinc-700 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            {hasEntries ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
              )
            ) : (
              <span className="w-3" />
            )}
            {detail.compteNum}
          </span>
        </td>
        <td className="py-1.5 px-3 text-zinc-600 max-w-[280px] truncate">
          {detail.compteLib}
        </td>
        <td className="py-1.5 px-3 text-right font-mono text-xs whitespace-nowrap">
          {detail.debit > 0 ? formatAmountExact(detail.debit) : "—"}
        </td>
        <td className="py-1.5 px-3 text-right font-mono text-xs whitespace-nowrap">
          {detail.credit > 0 ? formatAmountExact(detail.credit) : "—"}
        </td>
        <td
          className={`py-1.5 px-3 text-right font-mono text-xs font-medium whitespace-nowrap ${
            detail.solde < 0 ? "text-red-600" : "text-zinc-900"
          }`}
        >
          {formatAmountExact(detail.solde)}
        </td>
        <td className="py-1.5 px-3 text-right text-xs text-zinc-400 whitespace-nowrap">
          {detail.entryCount}
        </td>
      </tr>

      {/* Expanded entries */}
      {isExpanded && hasEntries && (
        <tr className="bg-zinc-50/70">
          <td colSpan={6} className="px-0 py-0">
            <EntrySubTable entries={detail.entries!} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Entries sub-table ──

function EntrySubTable({ entries }: { entries: EntryDetail[] }) {
  const sorted = [...entries].sort(
    (a, b) => a.ecritureDate.getTime() - b.ecritureDate.getTime()
  );

  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-[10px] text-zinc-400 uppercase border-b border-zinc-200/60">
          <th className="py-1 px-3 pl-10 text-left font-medium">Date</th>
          <th className="py-1 px-3 text-left font-medium">Journal</th>
          <th className="py-1 px-3 text-left font-medium">Pièce</th>
          <th className="py-1 px-3 text-left font-medium">Libellé</th>
          <th className="py-1 px-3 text-right font-medium">Débit</th>
          <th className="py-1 px-3 text-right font-medium">Crédit</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((entry, idx) => (
          <tr
            key={`${entry.ecritureNum}-${idx}`}
            className="border-b border-zinc-100/60"
          >
            <td className="py-1 px-3 pl-10 font-mono text-zinc-500 whitespace-nowrap">
              {formatDate(entry.ecritureDate)}
            </td>
            <td className="py-1 px-3 text-zinc-500">
              {entry.journalCode}
            </td>
            <td className="py-1 px-3 text-zinc-400 max-w-[80px] truncate">
              {entry.pieceRef}
            </td>
            <td className="py-1 px-3 text-zinc-500 max-w-[220px] truncate">
              {entry.ecritureLib || entry.compteLib}
            </td>
            <td className="py-1 px-3 text-right font-mono text-zinc-500 whitespace-nowrap">
              {entry.debit > 0 ? formatAmountExact(entry.debit) : "—"}
            </td>
            <td className="py-1 px-3 text-right font-mono text-zinc-500 whitespace-nowrap">
              {entry.credit > 0 ? formatAmountExact(entry.credit) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Sortable table header ──

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
      className={`py-2 px-3 text-xs font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-700 whitespace-nowrap ${className}`}
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
