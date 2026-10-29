'use client';

import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MonthlyNdviSeries } from '@/lib/types';

interface Props {
  monthlySeries: MonthlyNdviSeries[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#0D1B0F] border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-eco-neon font-mono font-bold mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: entry.color }} />
          <span className="text-zinc-300">{entry.name}:</span>
          <span className="text-white font-semibold">
            {entry.name.toLowerCase().includes('ndvi')
              ? Number(entry.value ?? 0).toFixed(3)
              : `${Number(entry.value ?? 0).toFixed(1)} mm`}
          </span>
        </div>
      ))}
    </div>
  );
};

export function RainfallNdviDualAxisChart({ monthlySeries }: Props) {
  const [showHistorical, setShowHistorical] = useState(true);

  const data = monthlySeries.map((m) => ({
    label: m.label.replace(' 2024', '').replace(' 2025', ''),
    fullLabel: m.label,
    rainfall: m.rainfallMm,
    histRainfall: m.historicalAvgRainfallMm,
    ndvi: m.currentNdvi,
    histNdvi: m.fiveYearAvgNdvi,
    deficit: m.rainfallDeficitPercent,
  }));

  const hasData = data.some((d) => d.rainfall !== null || d.ndvi !== null);

  if (!hasData) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 p-6 text-center text-zinc-500 text-sm">
        No rainfall/NDVI data available for this period.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 backdrop-blur-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Rainfall & NDVI — Dual Axis</h3>
          <p className="text-xs text-zinc-500 mt-0.5">CHIRPS satellite precipitation vs Sentinel-2 canopy index</p>
        </div>
        <button
          onClick={() => setShowHistorical((p) => !p)}
          className={`text-[11px] px-3 py-1.5 rounded-lg border font-mono transition-all ${
            showHistorical
              ? 'bg-eco-900/60 border-eco-700 text-eco-neon'
              : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
          }`}
        >
          {showHistorical ? '▶ Historical Overlay ON' : '▶ Historical Overlay OFF'}
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          {/* Left Y-Axis: Rainfall (mm) */}
          <YAxis
            yAxisId="rain"
            orientation="left"
            tick={{ fill: '#60a5fa', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Rain (mm)', angle: -90, position: 'insideLeft', fill: '#60a5fa', fontSize: 10, dy: 50 }}
          />
          {/* Right Y-Axis: NDVI */}
          <YAxis
            yAxisId="ndvi"
            orientation="right"
            domain={[0, 0.9]}
            tick={{ fill: '#C6F135', fontSize: 11, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'NDVI', angle: 90, position: 'insideRight', fill: '#C6F135', fontSize: 10, dy: -30 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
            formatter={(value) => <span style={{ color: '#a1a1aa' }}>{value}</span>}
          />
          {/* Rainfall Bars */}
          <Bar yAxisId="rain" dataKey="rainfall" name="Rainfall (mm)" fill="#3b82f6" opacity={0.7} radius={[2, 2, 0, 0]} />
          {showHistorical && (
            <Bar yAxisId="rain" dataKey="histRainfall" name="Hist. Avg Rainfall" fill="#1d4ed8" opacity={0.35} radius={[2, 2, 0, 0]} />
          )}
          {/* NDVI Lines */}
          <Line
            yAxisId="ndvi"
            type="monotone"
            dataKey="ndvi"
            name="Current NDVI"
            stroke="#C6F135"
            strokeWidth={2.5}
            dot={{ fill: '#C6F135', r: 3, strokeWidth: 0 }}
            connectNulls
          />
          {showHistorical && (
            <Line
              yAxisId="ndvi"
              type="monotone"
              dataKey="histNdvi"
              name="5-Yr Avg NDVI"
              stroke="#86efac"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
            />
          )}
          <ReferenceLine yAxisId="ndvi" y={0.3} stroke="rgba(251,191,36,0.3)" strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Insight pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        {data.map((d) => {
          if (d.deficit === null || d.deficit === undefined) return null;
          const isDeficit = d.deficit < -10;
          const isSurplus = d.deficit > 10;
          if (!isDeficit && !isSurplus) return null;
          return (
            <span
              key={d.fullLabel}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isDeficit
                  ? 'bg-red-950/40 border-red-500/30 text-red-400'
                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {d.label}: {isSurplus ? '+' : ''}{d.deficit}%
            </span>
          );
        })}
      </div>
    </div>
  );
}
