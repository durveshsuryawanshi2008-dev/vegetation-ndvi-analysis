'use client';

import React from 'react';
import { MultiYearComparison } from '@/lib/types';
import { Calendar, ArrowUpRight, ArrowDownRight, Layers, HelpCircle } from 'lucide-react';

interface Props {
  comparison?: MultiYearComparison;
  areaName: string;
}

function getNdviColorClass(ndvi: number | null): string {
  if (ndvi === null) return 'text-zinc-600 bg-white/[0.01]';
  if (ndvi >= 0.50) return 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30';
  if (ndvi >= 0.38) return 'text-lime-300 bg-lime-950/30 border-lime-500/20';
  if (ndvi >= 0.28) return 'text-yellow-300 bg-yellow-950/30 border-yellow-500/20';
  if (ndvi >= 0.20) return 'text-orange-300 bg-orange-950/30 border-orange-500/20';
  return 'text-rose-300 bg-rose-950/40 border-rose-500/30';
}

export function MultiYearNdviMatrix({ comparison, areaName }: Props) {
  if (!comparison || !comparison.months || comparison.months.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 p-6 text-center text-zinc-500 text-sm">
        No multi-year comparison data available for this area.
      </div>
    );
  }

  const years = comparison.years || [2020, 2021, 2022, 2023, 2024, 2025];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-eco-neon" />
            <h3 className="text-sm font-semibold text-white">
              Multi-Year NDVI Comparison Matrix — {areaName}
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Month-by-month historical NDVI across all recorded years (2020–2025) with YoY change detection
          </p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-400">
          Source: Sentinel-2 SR & MODIS
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-black/20">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Month
              </th>
              {years.map((y) => (
                <th
                  key={y}
                  className={`px-3 py-3 text-center font-mono text-[10px] uppercase tracking-wider ${
                    y === 2025 || y === 2024
                      ? 'text-eco-neon font-bold bg-eco-neon/[0.04]'
                      : 'text-zinc-400'
                  }`}
                >
                  {y} {y === 2025 ? '(Current)' : ''}
                </th>
              ))}
              <th className="px-3 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                5-Yr Avg
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                YoY Change
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.months.map((m, idx) => {
              const yoy = m.yoyChangePercent;
              const isPositive = yoy !== null && yoy > 0;
              const isNegative = yoy !== null && yoy < 0;

              return (
                <tr
                  key={m.monthNum}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-white whitespace-nowrap">
                    {m.label}
                  </td>
                  {years.map((y) => {
                    const val = m.valuesByYear?.[y] ?? null;
                    const colorCls = getNdviColorClass(val);

                    return (
                      <td key={y} className="px-3 py-2 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-[11px] font-mono border ${colorCls}`}
                        >
                          {val !== null ? val.toFixed(3) : '—'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center font-mono text-zinc-300">
                    {m.fiveYearAvg !== null ? m.fiveYearAvg.toFixed(3) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {yoy !== null ? (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold ${
                          isPositive
                            ? 'text-emerald-400'
                            : isNegative
                            ? 'text-red-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : isNegative ? (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        ) : null}
                        {isPositive ? '+' : ''}
                        {yoy.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-mono">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-white/[0.04] flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-400">
        <span className="text-zinc-500 uppercase">NDVI Spectrum:</span>
        <span className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300">
          ≥ 0.50 Lush
        </span>
        <span className="px-2 py-0.5 rounded border border-lime-500/20 bg-lime-950/30 text-lime-300">
          0.38 - 0.49 Healthy
        </span>
        <span className="px-2 py-0.5 rounded border border-yellow-500/20 bg-yellow-950/30 text-yellow-300">
          0.28 - 0.37 Stressed
        </span>
        <span className="px-2 py-0.5 rounded border border-orange-500/20 bg-orange-950/30 text-orange-300">
          0.20 - 0.27 Moderate Drought
        </span>
        <span className="px-2 py-0.5 rounded border border-rose-500/30 bg-rose-950/40 text-rose-300">
          &lt; 0.20 Severe / Barren
        </span>
      </div>
    </div>
  );
}
