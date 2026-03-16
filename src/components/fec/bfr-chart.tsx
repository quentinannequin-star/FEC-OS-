"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TableProperties } from "lucide-react";
import { BfrDetailModal } from "./bfr-detail-modal";
import { BfrMonthlyTable } from "./bfr-monthly-table";
import { formatAmountK, formatMonthShort } from "@/lib/fec/format";
import type { AnalysisResult, BfrMonthResult } from "@/lib/fec/types";

/** Vivid gradient: oldest → newest */
const YEAR_COLORS = ["#a78bfa", "#22d3ee", "#e040fb", "#34d399", "#fbbf24"];

interface BfrChartProps {
  yearResults: AnalysisResult[];
}

export function BfrChart({ yearResults }: BfrChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showMonthlyTable, setShowMonthlyTable] = useState(false);

  if (yearResults.length === 0) return null;

  const isMultiYear = yearResults.length > 1;

  // Extract fiscal year labels from results
  const yearLabels = yearResults.map((yr) => yr.fiscalYear);

  // Assign colors: darkest for most recent
  const colorMap: Record<string, string> = {};
  const totalYears = yearLabels.length;
  yearLabels.forEach((label, idx) => {
    const colorIdx = Math.max(0, YEAR_COLORS.length - totalYears + idx);
    colorMap[label] = YEAR_COLORS[colorIdx];
  });

  if (!isMultiYear) {
    // Single year: use original simple chart
    return (
      <SingleYearBfrChart
        monthly={yearResults[0].bfrMonthly}
        yearLabel={yearLabels[0]}
        yearResults={yearResults}
      />
    );
  }

  // Multi-year: build chart data with months 01-12 on X-axis
  const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartData: any[] = MONTHS.map((m, idx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point: any = { month: m, monthLabel: monthNames[idx] };
    for (const yr of yearResults) {
      const monthData = yr.bfrMonthly.find((bm) => bm.month.endsWith(`-${m}`));
      point[yr.fiscalYear] = monthData ? Math.round(monthData.operatingBfr / 1000) : null;
    }
    return point;
  });

  // Filter out months with no data for any year
  const filteredData = chartData.filter((point) =>
    yearLabels.some((label) => point[label] !== null)
  );

  // For BFR detail modal, use most recent year
  const latestResult = yearResults[yearResults.length - 1];
  const selectedMonthData = selectedMonth
    ? latestResult.bfrMonthly.find((m) => m.month.endsWith(`-${selectedMonth}`))
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a2e] border border-white/10 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-white mb-1">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-[#8b8b9e]">
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: entry.color }}
            />
            {entry.dataKey} : <span className="font-mono">{entry.value ?? "—"} k€</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-white">
              BFR Opérationnel — Comparaison multi-exercices
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMonthlyTable(true)}
              className="text-[#8b8b9e] hover:text-white h-7 gap-1.5 text-xs"
            >
              <TableProperties className="h-3.5 w-3.5" />
              Tableau détaillé
            </Button>
          </div>
          <p className="text-xs text-[#8b8b9e]">
            Cliquez sur un mois pour le détail
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(state: any) => {
                  if (state?.activePayload?.[0]?.payload) {
                    setSelectedMonth(state.activePayload[0].payload.month);
                  }
                }}
              >
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#8b8b9e" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8b8b9e" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} k€`}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Legend
                  verticalAlign="top"
                  height={30}
                  formatter={(value) => <span className="text-xs text-[#8b8b9e]">{value}</span>}
                />
                {yearLabels.map((label) => (
                  <Bar
                    key={label}
                    dataKey={label}
                    fill={colorMap[label]}
                    radius={[2, 2, 0, 0]}
                    cursor="pointer"
                    maxBarSize={24}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* BFR detail modal */}
      {selectedMonthData && (
        <BfrDetailModal
          open={!!selectedMonth}
          onClose={() => setSelectedMonth(null)}
          monthData={selectedMonthData}
        />
      )}

      {/* Monthly table modal */}
      <BfrMonthlyTable
        open={showMonthlyTable}
        onClose={() => setShowMonthlyTable(false)}
        yearResults={yearResults}
      />
    </>
  );
}

/** Simple single-year BFR chart (preserves original behavior) */
function SingleYearBfrChart({
  monthly,
  yearLabel,
  yearResults,
}: {
  monthly: BfrMonthResult[];
  yearLabel: string;
  yearResults: AnalysisResult[];
}) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showMonthlyTable, setShowMonthlyTable] = useState(false);

  const chartData = monthly.map((m) => ({
    month: m.month,
    monthLabel: formatMonthShort(m.month),
    operatingBfr: Math.round(m.operatingBfr / 1000),
    operatingAssets: Math.round(m.operatingAssets / 1000),
    operatingLiabilities: Math.round(m.operatingLiabilities / 1000),
  }));

  const selectedMonthData = selectedMonth
    ? monthly.find((m) => m.month === selectedMonth)
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = payload[0]?.payload as any;
    return (
      <div className="bg-[#1a1a2e] border border-white/10 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-white mb-1">{data.month}</p>
        <p className="text-[#8b8b9e]">Actif circulant : <span className="font-mono">{data.operatingAssets} k€</span></p>
        <p className="text-[#8b8b9e]">Passif circulant : <span className="font-mono">{data.operatingLiabilities} k€</span></p>
        <p className="font-medium text-white mt-1 pt-1 border-t border-white/10">
          BFR opérationnel : <span className="font-mono">{data.operatingBfr} k€</span>
        </p>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-white">
              BFR Opérationnel Mensuel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMonthlyTable(true)}
              className="text-[#8b8b9e] hover:text-white h-7 gap-1.5 text-xs"
            >
              <TableProperties className="h-3.5 w-3.5" />
              Tableau détaillé
            </Button>
          </div>
          <p className="text-xs text-[#8b8b9e]">
            Cliquez sur une barre pour le détail
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(state: any) => {
                  if (state?.activePayload?.[0]?.payload) {
                    setSelectedMonth(state.activePayload[0].payload.month);
                  }
                }}
              >
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#8b8b9e" }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8b8b9e" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} k€`}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                <Bar
                  dataKey="operatingBfr"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  maxBarSize={40}
                  fill="#e040fb"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/[0.08]">
              <div className="text-center">
                <p className="text-xs text-[#8b8b9e]">Minimum</p>
                <p className="text-sm font-semibold font-mono text-white">
                  {formatAmountK(Math.min(...monthly.map((m) => m.operatingBfr)))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#8b8b9e]">Moyen</p>
                <p className="text-sm font-semibold font-mono text-white">
                  {formatAmountK(monthly.reduce((s, m) => s + m.operatingBfr, 0) / monthly.length)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#8b8b9e]">Maximum</p>
                <p className="text-sm font-semibold font-mono text-white">
                  {formatAmountK(Math.max(...monthly.map((m) => m.operatingBfr)))}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structured BFR detail modal */}
      {selectedMonthData && (
        <BfrDetailModal
          open={!!selectedMonth}
          onClose={() => setSelectedMonth(null)}
          monthData={selectedMonthData}
        />
      )}

      {/* Monthly table modal */}
      <BfrMonthlyTable
        open={showMonthlyTable}
        onClose={() => setShowMonthlyTable(false)}
        yearResults={yearResults}
      />
    </>
  );
}
