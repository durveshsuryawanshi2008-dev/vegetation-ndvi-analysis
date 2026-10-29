'use client';

import React from 'react';
import { MonthlyNdviSeries, VciClassification } from '@/lib/types';

interface Props {
  monthlySeries: MonthlyNdviSeries[];
}

// VCI classification logic (client-safe, no server imports)
function classifyVciLocal(vci: number | null): VciClassification {
  if (vci === null || Number.isNaN(vci)) return 'Normal';
  if (vci >= 60) return 'Good / Wet';
  if (vci >= 40) return 'Normal';
  if (vci >= 35) return 'Mild drought stress';
  if (vci >= 25) return 'Moderate drought';
  if (vci >= 15) return 'Severe drought';
  return 'Extreme drought';
}

const vciColors: Record<string, string> = {
  'Good / Wet': 'text-emerald-400 bg-emerald-950/50 border-emerald-700/40',
  Normal: 'text-lime-400 bg-lime-950/50 border-lime-700/40',
  'Mild drought stress': 'text-yellow-400 bg-yellow-950/50 border-yellow-700/40',
  'Moderate drought': 'text-orange-400 bg-orange-950/50 border-orange-700/40',
  'Severe drought': 'text-red-400 bg-red-950/50 border-red-700/40',
  'Extreme drought': 'text-rose-400 bg-rose-950/50 border-rose-700/40',
};

function NdviBar({ value, max = 0.9 }: { value: number | null; max?: number }) {
  if (value === null) return <span className="text-zinc-600 text-xs">—</span>;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-eco-neon"
          style={{ width: `${pct}%`, opacity: 0.85 }}
        />
      </div>
      <span className="text-white text-xs font-mono tabular-nums">{value.toFixed(3)}</span>
    </div>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-zinc-600 text-xs">—</span>;
  const positive = value > 0;
  const neutral = Math.abs(value) < 1;
  return (
    <span
      className={`text-xs font-mono tabular-nums ${
        neutral ? 'text-zinc-400' : positive ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      {positive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

export function DroughtHistoricalTable({ monthlySeries }: Props) {
  if (!monthlySeries || monthlySeries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 p-6 text-center text-zinc-500 text-sm">
        No historical data available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Monthly NDVI & Rainfall Historical Comparison</h3>
        <p className="text-xs text-zinc-500 mt-0.5">Current vs last year vs 5-year average baseline</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {[
                'Month',
                'Current NDVI',
                'Prev Month',
                'Last Year',
                '5-Yr Avg',
                'Anomaly %',
                'VCI',
                'Rainfall',
                'Deficit',
                'Status',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlySeries.map((m, i) => {
              const vciClass = m.vci !== null ? classifyVciLocal(m.vci) : 'Normal';
              const badgeClx = vciColors[vciClass] || vciColors.Normal;
              const isLatest = i === monthlySeries.length - 1;
              return (
                <tr
                  key={m.month}
                  className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${
                    isLatest ? 'bg-eco-neon/[0.03]' : ''
                  }`}
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span className="text-zinc-300 font-mono font-medium">{m.label}</span>
                    {isLatest && (
                      <span className="ml-2 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-eco-800/60 text-eco-neon border border-eco-700/50">
                        Latest
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <NdviBar value={m.currentNdvi} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-zinc-400 font-mono text-xs tabular-nums">
                      {m.previousMonthNdvi !== null ? m.previousMonthNdvi.toFixed(3) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-zinc-400 font-mono text-xs tabular-nums">
                      {m.sameMonthLastYearNdvi !== null ? m.sameMonthLastYearNdvi.toFixed(3) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-zinc-400 font-mono text-xs tabular-nums">
                      {m.fiveYearAvgNdvi !== null ? m.fiveYearAvgNdvi.toFixed(3) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <DeltaBadge value={m.anomalyPercent} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-zinc-300 font-mono tabular-nums text-xs">
                      {m.vci !== null ? `${m.vci.toFixed(1)}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-blue-300 font-mono tabular-nums text-xs">
                      {m.rainfallMm !== null ? `${m.rainfallMm.toFixed(0)} mm` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <DeltaBadge value={m.rainfallDeficitPercent} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeClx}`}>
                      {vciClass}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-white/[0.04] flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(vciColors).map(([label, cls]) => (
          <span key={label} className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${cls}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
