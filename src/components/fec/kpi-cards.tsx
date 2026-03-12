"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatPercent, formatDays, formatMultiple, formatAmountK } from "@/lib/fec/format";
import type { KpiResult } from "@/lib/fec/types";
import { AlertTriangle } from "lucide-react";

interface KpiCardsProps {
  kpis: KpiResult[];
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
      return "border-l-zinc-700";
    case "activity":
      return "border-l-zinc-500";
    case "leverage":
      return "border-l-zinc-400";
    case "coverage":
      return "border-l-zinc-300";
    default:
      return "border-l-zinc-200";
  }
}

export function KpiCards({ kpis }: KpiCardsProps) {
  // Group KPIs by category
  const categories = Array.from(new Set(kpis.map((k) => k.category)));

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const categoryKpis = kpis.filter((k) => k.category === category);
        return (
          <div key={category}>
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              {getCategoryLabel(category)}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryKpis.map((kpi) => (
                <Card
                  key={kpi.id}
                  className={`border-l-4 ${getCategoryColor(category)} ${
                    kpi.isAlert
                      ? "ring-1 ring-amber-300 bg-amber-50/30"
                      : ""
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs text-zinc-500 leading-tight mb-1">
                        {kpi.name}
                      </p>
                      {kpi.isAlert && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p
                      className={`text-lg font-bold font-mono ${
                        kpi.value === null
                          ? "text-zinc-300"
                          : kpi.isAlert
                          ? "text-amber-600"
                          : kpi.value < 0
                          ? "text-red-600"
                          : "text-zinc-900"
                      }`}
                    >
                      {formatKpiValue(kpi.value, kpi.unit)}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Benchmark : {kpi.benchmark}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
