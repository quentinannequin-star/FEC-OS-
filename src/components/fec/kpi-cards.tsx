"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatDays, formatMultiple, formatAmountK } from "@/lib/fec/format";
import type { KpiResult, AnalysisResult } from "@/lib/fec/types";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardsProps {
  yearResults: AnalysisResult[];
}

function formatKpiValue(value: number | null, unit: string): string {
  if (value === null || value === undefined || !isFinite(value)) return "N/A";
  switch (unit) {
    case "percent":
      return formatPercent(value);
    case "days":
      return formatDays(value);
    case "multiple":
      return formatMultiple(value);
    case "currency":
      return formatAmountK(value);
    default:
      return value.toFixed(1);
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "profitability":
      return "Profitabilité";
    case "activity":
      return "Activité / BFR";
    case "leverage":
      return "Endettement";
    case "coverage":
      return "Couverture";
    default:
      return category;
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "profitability":
      return "border-l-[#e040fb]";
    case "activity":
      return "border-l-[#22d3ee]";
    case "leverage":
      return "border-l-[#a78bfa]";
    case "coverage":
      return "border-l-[#34d399]";
    default:
      return "border-l-[#8b8b9e]";
  }
}

export function KpiCards({ yearResults }: KpiCardsProps) {
  if (yearResults.length === 0) return null;

  const latestKpis = yearResults[yearResults.length - 1].kpis;
  const prevKpis = yearResults.length >= 2 ? yearResults[yearResults.length - 2].kpis : null;
  const isMultiYear = yearResults.length > 1;

  // Build prev lookup
  const prevLookup = new Map<string, KpiResult>();
  if (prevKpis) {
    for (const kpi of prevKpis) prevLookup.set(kpi.id, kpi);
  }

  // Group KPIs by category
  const categories = Array.from(new Set(latestKpis.map((k) => k.category)));

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const categoryKpis = latestKpis.filter((k) => k.category === category);
        return (
          <div key={category}>
            <h3 className="text-xs font-medium text-[#8b8b9e] uppercase tracking-wide mb-2">
              {getCategoryLabel(category)}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryKpis.map((kpi) => {
                const prev = prevLookup.get(kpi.id);
                const hasTrend = isMultiYear && prev && kpi.value !== null && prev.value !== null;
                const delta = hasTrend ? kpi.value! - prev!.value! : 0;
                const isPositiveTrend = delta > 0;

                return (
                  <Card
                    key={kpi.id}
                    className={`border-l-4 ${getCategoryColor(category)} ${
                      kpi.isAlert
                        ? "ring-1 ring-amber-500/30 bg-amber-500/10"
                        : ""
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs text-[#8b8b9e] leading-tight mb-1">
                          {kpi.name}
                        </p>
                        {kpi.isAlert && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p
                        className={`text-lg font-bold font-mono ${
                          kpi.value === null
                            ? "text-[#52526b]"
                            : kpi.isAlert
                            ? "text-amber-400"
                            : kpi.value < 0
                            ? "text-red-400"
                            : "text-white"
                        }`}
                      >
                        {formatKpiValue(kpi.value, kpi.unit)}
                      </p>
                      {/* YoY trend */}
                      {hasTrend ? (
                        <div className="flex items-center gap-1 mt-1">
                          {isPositiveTrend ? (
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                          ) : delta < 0 ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : null}
                          <span className={`text-[10px] font-mono ${isPositiveTrend ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-[#52526b]"}`}>
                            {delta > 0 ? "+" : ""}{formatKpiValue(delta, kpi.unit)}
                          </span>
                          <span className="text-[10px] text-[#52526b]">
                            vs N-1
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#52526b] mt-1">
                          Benchmark : {kpi.benchmark}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
