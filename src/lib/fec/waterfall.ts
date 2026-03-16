// ============================================================
// PnL Waterfall — Data transformation for Recharts BarChart
// Separated from React component for performance
// ============================================================

import type { AngloSaxonLineResult } from "./types";

export interface WaterfallDataPoint {
  name: string;
  nameFr: string;
  transparent: number;
  positive: number;
  negative: number;
  subtotal: number;
  rawValue: number;
  isSubtotal: boolean;
}

/**
 * IDs that represent subtotals (full bars anchored at 0).
 * All others are variations (floating bars).
 */
const SUBTOTAL_IDS = new Set([
  "AS_010", // Revenue
  "AS_030", // Gross Margin
  "AS_070", // EBITDA
  "AS_100", // EBIT
  "AS_160", // Net Income
]);

/**
 * Ordered line IDs for the waterfall.
 * This defines the visual sequence of bars.
 */
const WATERFALL_ORDER = [
  "AS_010", // Revenue
  "AS_020", // COGS
  "AS_030", // Gross Margin
  "AS_040", // Personnel
  "AS_050", // External charges
  "AS_060", // Taxes & duties
  "AS_065", // Other operating income
  "AS_070", // EBITDA
  "AS_080", // D&A
  "AS_090", // Provisions & other
  "AS_100", // EBIT
  "AS_110", // Financial result
  "AS_130", // Exceptional items
  "AS_140", // Corporate tax
  "AS_150", // Employee profit sharing
  "AS_160", // Net Income
];

/**
 * Transform Anglo-Saxon P&L results into waterfall chart data.
 * Must be called outside of React render cycle for performance.
 *
 * Waterfall logic:
 * - Subtotals: full bar from 0 → value (transparent = 0)
 * - Variations positive: bar floats from runningTotal → runningTotal + value
 *   (transparent = runningTotal)
 * - Variations negative: bar floats from runningTotal + value → runningTotal
 *   (transparent = runningTotal + value, i.e. the new lower total)
 */
export function buildWaterfallData(
  asPnl: AngloSaxonLineResult[]
): WaterfallDataPoint[] {
  const lookup = new Map<string, AngloSaxonLineResult>();
  for (const line of asPnl) {
    lookup.set(line.id, line);
  }

  const result: WaterfallDataPoint[] = [];
  let runningTotal = 0;

  for (const id of WATERFALL_ORDER) {
    const line = lookup.get(id);
    if (!line) continue;

    const isSubtotal = SUBTOTAL_IDS.has(id);
    const value = line.amount;

    if (isSubtotal) {
      // Subtotal: full bar anchored at 0
      result.push({
        name: line.label,
        nameFr: line.label_fr,
        transparent: 0,
        positive: value >= 0 ? Math.round(value / 1000) : 0,
        negative: value < 0 ? Math.round(Math.abs(value) / 1000) : 0,
        subtotal: Math.round(value / 1000),
        rawValue: value,
        isSubtotal: true,
      });
      runningTotal = value;
    } else {
      // Variation: floating bar
      const valueK = Math.round(value / 1000);

      let transparent: number;
      if (value >= 0) {
        // Positive variation: bar sits on top of running total
        transparent = Math.round(runningTotal / 1000);
      } else {
        // Negative variation: bar hangs down from running total
        transparent = Math.round((runningTotal + value) / 1000);
      }

      result.push({
        name: line.label,
        nameFr: line.label_fr,
        transparent,
        positive: value >= 0 ? valueK : 0,
        negative: value < 0 ? Math.round(Math.abs(value) / 1000) : 0,
        subtotal: 0,
        rawValue: value,
        isSubtotal: false,
      });
      runningTotal += value;
    }
  }

  return result;
}
