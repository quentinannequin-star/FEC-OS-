"use client";

import { useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  extractRestatementCandidates,
  computeQoE,
  getReportedEbitda,
  createInitialQoEState,
} from "@/lib/fec/qoe";
import { formatAmountK } from "@/lib/fec/format";
import type { AnalysisResult } from "@/lib/fec/types";
import type { QoEState, RestatementCandidate, RestatementAccount } from "@/lib/fec/qoe";

// --------------- Colors ---------------
const COLOR_REPORTED = "#64748b"; // slate-500
const COLOR_BEAR = "#ef4444"; // red-500
const COLOR_BULL = "#22c55e"; // green-500
const COLOR_ADJUSTED = "#3b82f6"; // blue-500

// --------------- Flag badge colors ---------------
const FLAG_COLORS: Record<string, string> = {
  one_off: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  lease_ifrs16: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  cvae_reclass: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  director_comp: "bg-rose-500/15 text-rose-400 border-rose-500/20",
  capex_proxy: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  cir_reclass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  ic_risk: "bg-red-500/15 text-red-400 border-red-500/20",
};

const FLAG_SHORT_LABELS: Record<string, string> = {
  one_off: "Non récurrent",
  lease_ifrs16: "IFRS 16",
  cvae_reclass: "CVAE",
  director_comp: "Rém. Dirigeant",
  capex_proxy: "CAPEX Proxy",
  cir_reclass: "CIR / CICE",
  ic_risk: "Intra-groupe",
};

// --------------- Props ---------------
interface QoEDashboardProps {
  yearResults: AnalysisResult[];
}

export function QoEDashboard({ yearResults }: QoEDashboardProps) {
  const [selectedYearIdx, setSelectedYearIdx] = useState(
    yearResults.length - 1
  );
  const currentYear = yearResults[selectedYearIdx];

  // Extract candidates (memoized per year)
  const candidates = useMemo(
    () => extractRestatementCandidates(currentYear.pnl),
    [currentYear]
  );

  // QoE state
  const [qoeState, setQoEState] = useState<QoEState>(() =>
    createInitialQoEState(candidates)
  );

  // Track which rows are expanded (show account details)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const reportedEbitda = useMemo(
    () => getReportedEbitda(currentYear),
    [currentYear]
  );

  // Compute QoE result
  const qoe = useMemo(
    () => computeQoE(reportedEbitda, candidates, qoeState),
    [reportedEbitda, candidates, qoeState]
  );

  // Master toggle handler
  const handleToggle = useCallback((lineId: string, checked: boolean) => {
    setQoEState((prev) => ({
      ...prev,
      toggles: { ...prev.toggles, [lineId]: checked },
    }));
  }, []);

  // Per-account toggle handler
  const handleAccountToggle = useCallback(
    (lineId: string, compteNum: string, checked: boolean) => {
      const key = `${lineId}:${compteNum}`;
      setQoEState((prev) => ({
        ...prev,
        accountToggles: { ...prev.accountToggles, [key]: checked },
      }));
    },
    []
  );

  // Toggle all accounts within a line
  const handleToggleAllAccounts = useCallback(
    (lineId: string, accounts: RestatementAccount[], on: boolean) => {
      setQoEState((prev) => {
        const accountToggles = { ...prev.accountToggles };
        for (const acc of accounts) {
          accountToggles[`${lineId}:${acc.compteNum}`] = on;
        }
        return { ...prev, accountToggles };
      });
    },
    []
  );

  // Expand/collapse row
  const toggleExpand = useCallback((lineId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  }, []);

  // Director normative cost handler
  const handleNormativeCost = useCallback((value: string) => {
    const parsed = parseFloat(value.replace(/\s/g, "").replace(",", "."));
    setQoEState((prev) => ({
      ...prev,
      directorNormativeCost: isNaN(parsed) ? 0 : -Math.abs(parsed),
    }));
  }, []);

  // Toggle all
  const handleToggleAll = useCallback(
    (on: boolean) => {
      setQoEState((prev) => {
        const toggles = { ...prev.toggles };
        for (const c of candidates) {
          if (c.isAboveEbitda) toggles[c.lineId] = on;
        }
        return { ...prev, toggles };
      });
    },
    [candidates]
  );

  // Bar chart data
  const chartData = useMemo(
    () => [
      {
        name: "EBITDA\nComptable",
        value: Math.round(qoe.reportedEbitda / 1000),
        color: COLOR_REPORTED,
      },
      {
        name: "Bear\nCase",
        value: Math.round(qoe.bearCaseEbitda / 1000),
        color: COLOR_BEAR,
      },
      {
        name: "EBITDA\nAjusté",
        value: Math.round(qoe.adjustedEbitda / 1000),
        color: COLOR_ADJUSTED,
      },
      {
        name: "Bull\nCase",
        value: Math.round(qoe.bullCaseEbitda / 1000),
        color: COLOR_BULL,
      },
    ],
    [qoe]
  );

  // Count active toggles
  const activeCount = Object.values(qoeState.toggles).filter(Boolean).length;
  const aboveEbitdaCandidates = candidates.filter((c) => c.isAboveEbitda);
  const belowEbitdaCandidates = candidates.filter((c) => !c.isAboveEbitda);

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-8 w-8 text-[#52526b] mx-auto mb-2" />
          <p className="text-sm text-[#8b8b9e]">
            Aucun retraitement détecté dans ce P&L
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiBox
          label="EBITDA Comptable"
          value={formatAmountK(qoe.reportedEbitda)}
          color="text-[#8b8b9e]"
        />
        <KpiBox
          label="EBITDA Ajusté"
          value={formatAmountK(qoe.adjustedEbitda)}
          color="text-blue-400"
          highlight
        />
        <KpiBox
          label="Variation"
          value={`${qoe.variationPct >= 0 ? "+" : ""}${qoe.variationPct.toFixed(1)} %`}
          color={qoe.variationPct >= 0 ? "text-emerald-400" : "text-red-400"}
          icon={
            qoe.variationPct >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )
          }
        />
        <KpiBox
          label="Retraitements actifs"
          value={`${activeCount} / ${aboveEbitdaCandidates.length}`}
          color="text-[#e040fb]"
        />
      </div>

      {/* Year selector */}
      {yearResults.length > 1 && (
        <div className="flex gap-1">
          {yearResults.map((yr, idx) => (
            <button
              key={yr.fiscalYear}
              onClick={() => setSelectedYearIdx(idx)}
              className={`h-7 px-2.5 text-xs rounded-md font-medium transition-colors ${
                selectedYearIdx === idx
                  ? "bg-[#e040fb]/20 text-[#e040fb]"
                  : "text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {yr.fiscalYear}
            </button>
          ))}
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LEFT: Restatement control panel — 3/5 */}
        <div className="lg:col-span-3 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white">
                  Retraitements EBITDA
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleAll(true)}
                    className="text-[10px] text-[#8b8b9e] hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Tout activer
                  </button>
                  <button
                    onClick={() => handleToggleAll(false)}
                    className="text-[10px] text-[#8b8b9e] hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Tout désactiver
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {/* Above EBITDA items */}
              {aboveEbitdaCandidates.map((c) => (
                <RestatementRow
                  key={c.lineId}
                  candidate={c}
                  isActive={qoeState.toggles[c.lineId] ?? false}
                  isExpanded={expandedRows[c.lineId] ?? false}
                  onToggle={handleToggle}
                  onExpand={toggleExpand}
                  onAccountToggle={handleAccountToggle}
                  onToggleAllAccounts={handleToggleAllAccounts}
                  accountToggles={qoeState.accountToggles}
                  directorNormativeCost={qoeState.directorNormativeCost}
                  onNormativeCostChange={handleNormativeCost}
                />
              ))}

              {/* Below EBITDA items (informational) */}
              {belowEbitdaCandidates.length > 0 && (
                <>
                  <div className="pt-3 pb-1 flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/[0.06]" />
                    <span className="text-[10px] text-[#52526b] uppercase tracking-wider">
                      Hors EBITDA (informatif)
                    </span>
                    <div className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  {belowEbitdaCandidates.map((c) => (
                    <RestatementRow
                      key={c.lineId}
                      candidate={c}
                      isActive={false}
                      isExpanded={expandedRows[c.lineId] ?? false}
                      onToggle={() => {}}
                      onExpand={toggleExpand}
                      onAccountToggle={() => {}}
                      onToggleAllAccounts={() => {}}
                      accountToggles={qoeState.accountToggles}
                      disabled
                      directorNormativeCost={0}
                      onNormativeCostChange={() => {}}
                    />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Scenario chart — 2/5 */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white">
                Scénarios EBITDA
              </CardTitle>
              <p className="text-[10px] text-[#52526b]">
                Comparaison Bear / Reported / Adjusted / Bull
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#8b8b9e" }}
                      tickLine={false}
                      axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#8b8b9e" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v} k€`}
                      width={65}
                    />
                    <Tooltip
                      content={<ScenarioTooltip />}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      label={(props: any) => {
                        const { x = 0, y = 0, width = 0, value = 0 } = props;
                        return (
                          <text
                            x={x + width / 2}
                            y={y - 6}
                            textAnchor="middle"
                            fill="#c0c0d0"
                            fontSize={11}
                            fontFamily="monospace"
                            fontWeight={600}
                          >
                            {value} k€
                          </text>
                        );
                      }}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <LegendItem color={COLOR_REPORTED} label="Comptable" />
                <LegendItem color={COLOR_BEAR} label="Bear Case" />
                <LegendItem color={COLOR_ADJUSTED} label="Ajusté" />
                <LegendItem color={COLOR_BULL} label="Bull Case" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// --------------- Sub-components ---------------

function KpiBox({
  label,
  value,
  color,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Card
      className={
        highlight
          ? "border-blue-500/30 bg-blue-500/[0.05]"
          : ""
      }
    >
      <CardContent className="py-3 px-4">
        <p className="text-[10px] text-[#52526b] uppercase tracking-wider mb-1">
          {label}
        </p>
        <div className={`flex items-center gap-1.5 ${color}`}>
          {icon}
          <span className="text-lg font-bold font-mono">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function RestatementRow({
  candidate,
  isActive,
  isExpanded,
  onToggle,
  onExpand,
  onAccountToggle,
  onToggleAllAccounts,
  accountToggles,
  disabled,
  directorNormativeCost,
  onNormativeCostChange,
}: {
  candidate: RestatementCandidate;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: (lineId: string, checked: boolean) => void;
  onExpand: (lineId: string) => void;
  onAccountToggle: (lineId: string, compteNum: string, checked: boolean) => void;
  onToggleAllAccounts: (lineId: string, accounts: RestatementAccount[], on: boolean) => void;
  accountToggles: Record<string, boolean>;
  disabled?: boolean;
  directorNormativeCost: number;
  onNormativeCostChange: (value: string) => void;
}) {
  const c = candidate;
  const hasAccounts = c.accounts.length > 0;

  // Count how many accounts are toggled on
  const activeAccounts = c.accounts.filter(
    (acc) => accountToggles[`${c.lineId}:${acc.compteNum}`] ?? true
  );
  const accountOnCount = activeAccounts.length;
  const allOn = accountOnCount === c.accounts.length;
  const noneOn = accountOnCount === 0;

  // Dynamic amounts: reflect only toggled-on accounts when master is active
  const effectiveAmount =
    isActive && hasAccounts
      ? activeAccounts.reduce((sum, acc) => sum + Math.abs(acc.solde), 0)
      : Math.abs(c.amount);
  const effectiveImpact =
    isActive && hasAccounts
      ? activeAccounts.reduce((sum, acc) => sum + acc.ebitdaImpact, 0)
      : c.ebitdaImpact;

  const amountK = Math.round(effectiveAmount / 1000);
  const impactK = Math.round(effectiveImpact / 1000);
  const isAddBack = effectiveImpact > 0;

  return (
    <div className="rounded-lg overflow-hidden">
      {/* Main row */}
      <div
        className={`
          flex items-center gap-3 py-2.5 px-3 transition-all
          ${disabled ? "opacity-50" : ""}
          ${isActive ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"}
          ${isExpanded && hasAccounts ? "rounded-b-none" : ""}
        `}
      >
        {/* Toggle */}
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => onToggle(c.lineId, checked)}
          disabled={disabled || !c.isAboveEbitda}
          className="shrink-0"
        />

        {/* Expand arrow (only if accounts exist) */}
        {hasAccounts ? (
          <button
            onClick={() => onExpand(c.lineId)}
            className="shrink-0 p-0.5 rounded hover:bg-white/[0.06] transition-colors text-[#52526b] hover:text-white"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <div className="w-[18px] shrink-0" />
        )}

        {/* Label + flag */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs truncate ${isActive ? "text-white" : "text-[#c0c0d0]"}`}
            >
              {c.label}
            </span>
            <Badge
              variant="outline"
              className={`text-[9px] px-1.5 py-0 h-4 shrink-0 ${FLAG_COLORS[c.flag] ?? ""}`}
            >
              {FLAG_SHORT_LABELS[c.flag] ?? c.flag}
            </Badge>
            {/* Account count indicator */}
            {hasAccounts && isActive && (
              <span className="text-[9px] text-[#52526b]">
                {accountOnCount}/{c.accounts.length} comptes
              </span>
            )}
          </div>

          {/* Director comp: normative cost input */}
          {c.flag === "director_comp" && isActive && (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] text-[#52526b]">
                Coût normatif :
              </span>
              <input
                type="text"
                defaultValue={
                  directorNormativeCost !== 0
                    ? Math.abs(directorNormativeCost).toString()
                    : ""
                }
                placeholder="ex: 80000"
                onChange={(e) => onNormativeCostChange(e.target.value)}
                className="w-24 h-5 px-2 text-[10px] font-mono bg-white/[0.06] border border-white/10 rounded text-white placeholder:text-[#52526b] focus:outline-none focus:border-[#e040fb]/50"
              />
              <span className="text-[10px] text-[#52526b]">€/an</span>
            </div>
          )}

          {/* Alert for non-EBITDA items */}
          {!c.isAboveEbitda && (
            <div className="flex items-center gap-1 mt-0.5">
              <AlertTriangle className="h-2.5 w-2.5 text-amber-500/60" />
              <span className="text-[9px] text-amber-500/60">
                Hors périmètre EBITDA
              </span>
            </div>
          )}
        </div>

        {/* Historical amount */}
        <div className="text-right shrink-0">
          <p className="text-xs font-mono text-[#8b8b9e]">{amountK} k€</p>
        </div>

        {/* EBITDA impact */}
        {c.isAboveEbitda && (
          <div className="text-right shrink-0 w-16">
            <p
              className={`text-xs font-mono font-semibold ${
                isAddBack ? "text-emerald-400" : "text-red-400"
              } ${!isActive ? "opacity-40" : ""}`}
            >
              {isAddBack ? "+" : ""}
              {impactK} k€
            </p>
          </div>
        )}
      </div>

      {/* Expandable account details */}
      {isExpanded && hasAccounts && (
        <div className="bg-white/[0.02] border-t border-white/[0.04] px-3 py-2">
          {/* Select all / none */}
          {c.isAboveEbitda && isActive && (
            <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/[0.04]">
              <button
                onClick={() => onToggleAllAccounts(c.lineId, c.accounts, true)}
                className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                  allOn
                    ? "text-[#52526b]"
                    : "text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
                }`}
                disabled={allOn}
              >
                Tout cocher
              </button>
              <button
                onClick={() => onToggleAllAccounts(c.lineId, c.accounts, false)}
                className={`text-[9px] px-1.5 py-0.5 rounded transition-colors ${
                  noneOn
                    ? "text-[#52526b]"
                    : "text-[#8b8b9e] hover:text-white hover:bg-white/[0.06]"
                }`}
                disabled={noneOn}
              >
                Tout décocher
              </button>
            </div>
          )}

          {/* Account list */}
          <div className="space-y-0.5">
            {c.accounts.map((acc) => {
              const key = `${c.lineId}:${acc.compteNum}`;
              const isOn = accountToggles[key] ?? true;
              const accImpactK = Math.round(acc.ebitdaImpact / 1000);
              const accSoldeK = Math.round(acc.solde / 1000);
              const canToggle = c.isAboveEbitda && isActive;

              return (
                <div
                  key={key}
                  className={`
                    flex items-center gap-2.5 py-1.5 px-2 rounded-md transition-all
                    ${canToggle ? "hover:bg-white/[0.03] cursor-pointer" : "opacity-60"}
                  `}
                  onClick={() => {
                    if (canToggle) onAccountToggle(c.lineId, acc.compteNum, !isOn);
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className={`
                      w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center transition-colors
                      ${
                        canToggle && isOn
                          ? "bg-[#e040fb] border-[#e040fb]"
                          : canToggle
                            ? "border-white/20 bg-transparent"
                            : "border-white/10 bg-transparent"
                      }
                    `}
                  >
                    {isOn && canToggle && (
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    )}
                  </div>

                  {/* Account number */}
                  <span className="text-[10px] font-mono text-[#52526b] w-12 shrink-0">
                    {acc.compteNum}
                  </span>

                  {/* Account label */}
                  <span
                    className={`text-[11px] flex-1 min-w-0 truncate ${
                      canToggle && isOn ? "text-[#c0c0d0]" : "text-[#6b6b80]"
                    }`}
                  >
                    {acc.compteLib}
                  </span>

                  {/* Solde */}
                  <span className="text-[10px] font-mono text-[#8b8b9e] shrink-0">
                    {accSoldeK} k€
                  </span>

                  {/* EBITDA impact per account */}
                  {c.isAboveEbitda && acc.ebitdaImpact !== 0 && (
                    <span
                      className={`text-[10px] font-mono shrink-0 w-14 text-right ${
                        acc.ebitdaImpact > 0 ? "text-emerald-400/70" : "text-red-400/70"
                      } ${!isOn || !isActive ? "opacity-30" : ""}`}
                    >
                      {acc.ebitdaImpact > 0 ? "+" : ""}
                      {accImpactK} k€
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2.5 h-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-[#8b8b9e]">{label}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScenarioTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-lg shadow-lg p-3 text-xs">
      <p className="text-white font-medium mb-1">
        {d.name?.replace("\n", " ")}
      </p>
      <p className="font-mono text-white font-semibold">{d.value} k€</p>
    </div>
  );
}
