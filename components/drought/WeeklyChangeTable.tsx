'use client';

import React from 'react';
import { WeeklyNdviSeries } from '@/lib/types';
import { Calendar, TrendingDown, TrendingUp, Minus, Activity } from 'lucide-react';

interface Props {
  weeklySeries: WeeklyNdviSeries[];
  areaName: string;
}

function NdviBar({ value, max = 0.8 }: { value: number | null; max?: number }) {
  if (value === null) return <span className="text-zinc-600 text-xs">—</span>;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-eco-neon"
          style={{ width: `${pct}%`, opacity: 0.85 }}
        />
      </div>
      <span className="text-white text-xs font-mono tabular-nums">{value.toFixed(4)}</span>
    </div>
  );
}

export function WeeklyChangeTable({ weeklySeries, areaName }: Props) {
  if (!weeklySeries || weeklySeries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 p-6 text-center text-zinc-500 text-sm">
        No weekly series data available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-eco-neon" />
            <h3 className="text-sm font-semibold text-white">
              Weekly NDVI & Week-over-Week Change Tracker — {areaName}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            12-week rolling Sentinel-2 satellite greenness, delta velocity, and condition index
          </p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400">
          7-Day Rolling Intervals
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-black/20">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Week
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Dates
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Current NDVI
              </th>
              <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                WoW Change
              </th>
              <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Hist. Baseline
              </th>
              <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Anomaly %
              </th>
              <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                VCI
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Canopy Status
              </th>
            </tr>
          </thead>
          <tbody>
            {weeklySeries.map((w, idx) => {
              const changePct = w.changeFromPrevWeekPercent;
              const hasChange = typeof changePct === 'number' && !Number.isNaN(changePct);
              const isDecline = hasChange && changePct < -0.1;
              const isGrowth = hasChange && changePct > 0.1;
              const isLatest = idx === weeklySeries.length - 1;

              return (
                <tr
                  key={w.weekIndex}
                  className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${
                    isLatest ? 'bg-eco-neon/[0.03]' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono font-medium text-white whitespace-nowrap">
                    Week {w.weekIndex}
                    {isLatest && (
                      <span className="ml-2 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-eco-800/60 text-eco-neon border border-eco-700/50">
                        Latest
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400 whitespace-nowrap">
                    {w.label}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <NdviBar value={w.currentNdvi} />
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {changePct !== null && changePct !== undefined ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                          isDecline
                            ? 'text-red-400 bg-red-950/30 border-red-500/30'
                            : isGrowth
                            ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30'
                            : 'text-zinc-400 bg-white/[0.02] border-white/10'
                        }`}
                      >
                        {isDecline ? (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        ) : isGrowth ? (
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Minus className="w-3 h-3 text-zinc-400" />
                        )}
                        {isGrowth ? '+' : ''}
                        {changePct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-mono text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-zinc-300">
                    {w.historicalAvgNdvi !== null ? w.historicalAvgNdvi.toFixed(4) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono whitespace-nowrap">
                    {w.anomalyPercent !== null ? (
                      <span
                        className={`text-xs font-bold ${
                          w.anomalyPercent < 0 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      >
                        {w.anomalyPercent > 0 ? '+' : ''}
                        {w.anomalyPercent.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-white whitespace-nowrap">
                    {w.vci !== null ? `${w.vci.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        w.vegetationStatus === 'Very Healthy'
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40'
                          : w.vegetationStatus === 'Healthy'
                          ? 'text-lime-400 bg-lime-950/40 border-lime-500/40'
                          : w.vegetationStatus === 'Low/Moderate'
                          ? 'text-yellow-400 bg-yellow-950/40 border-yellow-500/40'
                          : 'text-rose-400 bg-rose-950/40 border-rose-500/40'
                      }`}
                    >
                      {w.vegetationStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
