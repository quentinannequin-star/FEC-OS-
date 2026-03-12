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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailModal } from "./detail-modal";
import { formatAmountK, formatMonthShort } from "@/lib/fec/format";
import type { BfrMonthResult, AccountDetail } from "@/lib/fec/types";

interface BfrChartProps {
  monthly: BfrMonthResult[];
}

interface ChartDataPoint {
  month: string;
  monthLabel: string;
  operatingBfr: number;
  operatingAssets: number;
  operatingLiabilities: number;
}

export function BfrChart({ monthly }: BfrChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const chartData: ChartDataPoint[] = monthly.map((m) => ({
    month: m.month,
    monthLabel: formatMonthShort(m.month),
    operatingBfr: Math.round(m.operatingBfr / 1000),
    operatingAssets: Math.round(m.operatingAssets / 1000),
    operatingLiabilities: Math.round(m.operatingLiabilities / 1000),
  }));

  // Build detail data for selected month
  const selectedMonthData = selectedMonth
    ? monthly.find((m) => m.month === selectedMonth)
    : null;

  const detailForModal: AccountDetail[] = selectedMonthData
    ? selectedMonthData.lines
        .filter(
          (l) =>
            l.category === "operating_asset" ||
            l.category === "operating_liability"
        )
        .map((l) => ({
          compteNum: l.id,
          compteLib: l.label,
          debit: l.category === "operating_asset" ? l.amount : 0,
          credit: l.category === "operating_liability" ? l.amount : 0,
          solde: l.amount,
          entryCount: 0,
        }))
    : [];

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0]?.payload as ChartDataPoint;
    return (
      <div className="bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-xs">
        <p className="font-medium text-zinc-900 mb-1">{data.month}</p>
        <p className="text-zinc-600">
          Actif circulant : <span className="font-mono">{data.operatingAssets} k€</span>
        </p>
        <p className="text-zinc-600">
          Passif circulant : <span className="font-mono">{data.operatingLiabilities} k€</span>
        </p>
        <p className="font-medium text-zinc-900 mt-1 pt-1 border-t border-zinc-100">
          BFR opérationnel : <span className="font-mono">{data.operatingBfr} k€</span>
        </p>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-zinc-900">
            BFR Opérationnel Mensuel
          </CardTitle>
          <p className="text-xs text-zinc-500">
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
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e4e4e7" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v} k€`}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#d4d4d8" />
                <Bar
                  dataKey="operatingBfr"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  maxBarSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.operatingBfr >= 0 ? "#3f3f46" : "#ef4444"}
                      fillOpacity={
                        selectedMonth === entry.month ? 1 : 0.7
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats */}
          {chartData.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-zinc-100">
              <div className="text-center">
                <p className="text-xs text-zinc-500">Minimum</p>
                <p className="text-sm font-semibold font-mono text-zinc-900">
                  {formatAmountK(
                    Math.min(...monthly.map((m) => m.operatingBfr))
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500">Moyen</p>
                <p className="text-sm font-semibold font-mono text-zinc-900">
                  {formatAmountK(
                    monthly.reduce((s, m) => s + m.operatingBfr, 0) /
                      monthly.length
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500">Maximum</p>
                <p className="text-sm font-semibold font-mono text-zinc-900">
                  {formatAmountK(
                    Math.max(...monthly.map((m) => m.operatingBfr))
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail modal */}
      {selectedMonth && (
        <DetailModal
          open={!!selectedMonth}
          onClose={() => setSelectedMonth(null)}
          title={`BFR détail — ${selectedMonth}`}
          details={detailForModal}
        />
      )}
    </>
  );
}
