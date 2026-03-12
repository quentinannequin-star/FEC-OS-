"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Crown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PnlTable } from "./pnl-table";
import { BfrChart } from "./bfr-chart";
import { KpiCards } from "./kpi-cards";
import type { AnalysisResult } from "@/lib/fec/types";

interface ResultsViewProps {
  results: AnalysisResult[];
  onBack: () => void;
}

export function ResultsView({ results, onBack }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState(0);

  const current = results[activeTab];
  if (!current) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">
              Résultats de l&apos;analyse
            </h1>
            <p className="text-sm text-zinc-500">
              {results.length} entité{results.length > 1 ? "s" : ""} analysée{results.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs if multiple companies */}
      {results.length > 1 && (
        <div className="flex gap-2 border-b border-zinc-200 pb-0">
          {results.map((r, idx) => (
            <button
              key={r.companyId}
              onClick={() => setActiveTab(idx)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-[1px]
                ${
                  idx === activeTab
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-700"
                }
              `}
            >
              {r.companyType === "holding" ? (
                <Crown className="h-3.5 w-3.5" />
              ) : (
                <Building2 className="h-3.5 w-3.5" />
              )}
              {r.companyName}
            </button>
          ))}
        </div>
      )}

      {/* Company info bar */}
      <div className="flex items-center gap-3 text-sm text-zinc-500">
        <Badge variant="secondary">
          {current.companyType === "holding" ? "Holding" : "Opérationnelle"}
        </Badge>
        <span>{current.fiscalYear}</span>
        <span>{current.entryCount.toLocaleString("fr-FR")} écritures</span>
        {current.unmappedAccounts.length > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {current.unmappedAccounts.length} compte{current.unmappedAccounts.length > 1 ? "s" : ""} non mappé{current.unmappedAccounts.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Main grid: P&L left, BFR right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* P&L — 3/5 width */}
        <div className="lg:col-span-3">
          <PnlTable lines={current.pnl} />
        </div>

        {/* BFR + KPIs — 2/5 width */}
        <div className="lg:col-span-2 space-y-4">
          <BfrChart monthly={current.bfrMonthly} />
          <KpiCards kpis={current.kpis} />
        </div>
      </div>
    </div>
  );
}
