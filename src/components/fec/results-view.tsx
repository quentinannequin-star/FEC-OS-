"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Crown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PnlTable } from "./pnl-table";
import { AngloSaxonPnlTable } from "./anglo-saxon-pnl-table";
import { BfrChart } from "./bfr-chart";
import { PnlBridgeChart } from "./pnl-bridge-chart";
import { KpiCards } from "./kpi-cards";
import { QoEDashboard } from "./qoe-dashboard";
import type { MultiYearAnalysisResult } from "@/lib/fec/types";

interface ResultsViewProps {
  results: MultiYearAnalysisResult[];
  onBack: () => void;
}

export function ResultsView({ results, onBack }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState(0);

  const current = results[activeTab];
  if (!current || current.yearResults.length === 0) return null;

  const latestYear = current.yearResults[current.yearResults.length - 1];
  const allYearLabels = current.yearResults.map((yr) => yr.fiscalYear).join(" | ");
  const totalEntries = current.yearResults.reduce((sum, yr) => sum + yr.entryCount, 0);
  const totalUnmapped = latestYear.unmappedAccounts.length;

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
            <h1 className="text-xl font-semibold text-white">
              Résultats de l&apos;analyse
            </h1>
            <p className="text-sm text-[#8b8b9e]">
              {results.length} entité{results.length > 1 ? "s" : ""} analysée{results.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs if multiple companies */}
      {results.length > 1 && (
        <div className="flex gap-2 border-b border-white/[0.08] pb-0">
          {results.map((r, idx) => (
            <button
              key={r.companyId}
              onClick={() => setActiveTab(idx)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-[1px]
                ${
                  idx === activeTab
                    ? "border-[#e040fb] text-white"
                    : "border-transparent text-[#8b8b9e] hover:text-white"
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
      <div className="flex items-center gap-3 text-sm text-[#8b8b9e]">
        <Badge variant="secondary">
          {current.companyType === "holding" ? "Holding" : "Opérationnelle"}
        </Badge>
        <span>{allYearLabels}</span>
        <span>{totalEntries.toLocaleString("fr-FR")} écritures</span>
        {totalUnmapped > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {totalUnmapped} compte{totalUnmapped > 1 ? "s" : ""} non mappé{totalUnmapped > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Row 1: P&L table left, Bridge waterfall right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* P&L Tables — 3/5 */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="ma">
            <TabsList>
              <TabsTrigger value="ma">P&L M&A</TabsTrigger>
              <TabsTrigger value="sig">Détail (SIG)</TabsTrigger>
            </TabsList>
            <TabsContent value="ma" className="mt-3">
              <AngloSaxonPnlTable yearResults={current.yearResults} />
            </TabsContent>
            <TabsContent value="sig" className="mt-3">
              <PnlTable yearResults={current.yearResults} />
            </TabsContent>
          </Tabs>
        </div>

        {/* P&L Bridge Waterfall — 2/5, aligned with table below tabs, stretch to match P&L height */}
        <div className="lg:col-span-2 lg:pt-[48px] flex flex-col">
          <PnlBridgeChart yearResults={current.yearResults} className="flex-1" />
        </div>
      </div>

      {/* Row 2: BFR chart + KPIs — same 3/5 + 2/5 split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <BfrChart yearResults={current.yearResults} />
        </div>
        <div className="lg:col-span-2">
          <KpiCards yearResults={current.yearResults} />
        </div>
      </div>

      {/* Row 3: Quality of Earnings — full width */}
      <QoEDashboard yearResults={current.yearResults} />
    </div>
  );
}
