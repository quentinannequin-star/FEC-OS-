"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildWaterfallData } from "@/lib/fec/waterfall";
import { formatAmountK } from "@/lib/fec/format";
import type { AnalysisResult } from "@/lib/fec/types";
import type { WaterfallDataPoint } from "@/lib/fec/waterfall";

// Colors
const COLOR_POSITIVE = "#34d399"; // green
const COLOR_NEGATIVE = "#ef4444"; // red
const COLOR_SUBTOTAL = "#a78bfa"; // violet

interface PnlBridgeChartProps {
  yearResults: AnalysisResult[];
  className?: string;
}

export function PnlBridgeChart({ yearResults, className }: PnlBridgeChartProps) {
  const [selectedYear, setSelectedYear] = useState(
    yearResults[yearResults.length - 1]?.fiscalYear ?? ""
  );

  // Pre-compute waterfall data for ALL years (once, memoized)
  const waterfallByYear = useMemo(() => {
    const map = new Map<string, WaterfallDataPoint[]>();
    for (const yr of yearResults) {
      map.set(yr.fiscalYear, buildWaterfallData(yr.angloSaxonPnl));
    }
    return map;
  }, [yearResults]);

  const data = waterfallByYear.get(selectedYear) ?? [];

  if (data.length === 0) return null;

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
  }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload as WaterfallDataPoint;
    if (!point) return null;

    return (
      <div className="bg-[#1a1a2e] border border-white/10 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-white mb-0.5">{point.nameFr}</p>
        <p className="text-[#8b8b9e] text-[10px] mb-1">{point.name}</p>
        <p
          className={`font-mono font-semibold ${
            point.rawValue < 0 ? "text-red-400" : "text-white"
          }`}
        >
          {formatAmountK(point.rawValue)}
        </p>
        {point.isSubtotal && (
          <p className="text-[#52526b] text-[10px] mt-0.5">Sous-total</p>
        )}
      </div>
    );
  };

  // Use short labels for x-axis to avoid overlap
  const shortData = data.map((d) => ({
    ...d,
    shortName: shortenLabel(d.nameFr),
  }));

  return (
    <Card className={`${className ?? ""} flex flex-col`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-white">
            P&L Bridge — Revenue → Net Income
          </CardTitle>
          {yearResults.length > 1 && (
            <div className="flex gap-1">
              {yearResults.map((yr) => (
                <button
                  key={yr.fiscalYear}
                  onClick={() => setSelectedYear(yr.fiscalYear)}
                  className={`h-7 px-2.5 text-xs rounded-md font-medium transition-colors ${
                    selectedYear === yr.fiscalYear
                      ? "bg-[#e040fb]/20 text-[#e040fb]"
                      : "text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {yr.fiscalYear}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-[#8b8b9e]">
          Waterfall du compte de résultat anglo-saxon ({selectedYear})
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={shortData}
              margin={{ top: 24, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 10, fill: "#8b8b9e" }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                interval={0}
                angle={-40}
                textAnchor="end"
                height={90}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8b8b9e" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v} k€`}
                width={70}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />

              {/* Invisible base bar — pushes visible bars up */}
              <Bar
                dataKey="transparent"
                stackId="waterfall"
                fill="transparent"
                isAnimationActive={false}
              />

              {/* Positive / subtotal bars */}
              <Bar
                dataKey="positive"
                stackId="waterfall"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              >
                {shortData.map((entry, index) => (
                  <Cell
                    key={`pos-${index}`}
                    fill={entry.isSubtotal ? COLOR_SUBTOTAL : COLOR_POSITIVE}
                  />
                ))}
              </Bar>

              {/* Negative variation bars */}
              <Bar
                dataKey="negative"
                stackId="waterfall"
                radius={[3, 3, 0, 0]}
                isAnimationActive={false}
              >
                {shortData.map((entry, index) => (
                  <Cell
                    key={`neg-${index}`}
                    fill={entry.isSubtotal ? COLOR_SUBTOTAL : COLOR_NEGATIVE}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/** Shorten French P&L labels for x-axis readability */
function shortenLabel(label: string): string {
  const map: Record<string, string> = {
    "Chiffre d'affaires net": "CA net",
    "Coût des marchandises et matières": "COGS",
    "Marge brute": "Marge brute",
    "Charges de personnel": "Personnel",
    "Charges externes": "Ch. externes",
    "Impôts et taxes": "Impôts",
    "Autres produits d'exploitation": "Autres prod.",
    "Excédent brut d'exploitation": "EBITDA",
    "Dotations & reprises amortissements": "D&A",
    "Provisions et autres charges/produits": "Provisions",
    "Résultat d'exploitation": "EBIT",
    "Résultat financier": "Rés. financier",
    "Résultat exceptionnel": "Exceptionnel",
    "Impôt sur les sociétés": "IS",
    "Participation des salariés": "Participation",
    "Résultat net": "Rés. net",
    "Résultat avant impôts": "EBT",
  };
  return map[label] ?? label;
}
