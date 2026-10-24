'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { YearlyNdviResult } from '@/lib/types';
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface NdviChartProps {
  years: YearlyNdviResult[];
  areaName: string;
}

export function NdviChart({ years, areaName }: NdviChartProps) {
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');

  // Format data for Recharts
  const chartData = years.map((item, index) => {
    const prevItem = index > 0 ? years[index - 1] : null;
    let yoyChange: number | null = null;
    if (
      prevItem &&
      prevItem.avgNdvi !== null &&
      item.avgNdvi !== null &&
      prevItem.avgNdvi !== 0
    ) {
      yoyChange = Number(
        (((item.avgNdvi - prevItem.avgNdvi) / Math.abs(prevItem.avgNdvi)) * 100).toFixed(2)
      );
    }

    return {
      year: item.year.toString(),
      avgNdvi: item.avgNdvi !== null ? Number(item.avgNdvi.toFixed(4)) : null,
      minNdvi: item.minNdvi !== null ? Number(item.minNdvi.toFixed(4)) : null,
      maxNdvi: item.maxNdvi !== null ? Number(item.maxNdvi.toFixed(4)) : null,
      status: item.vegetationStatus,
      yoyChange,
    };
  });

  // Calculate 5-Year summary metrics
  const validData = chartData.filter((d) => d.avgNdvi !== null);
  const avg5Year =
    validData.length > 0
      ? Number(
          (
            validData.reduce((acc, curr) => acc + (curr.avgNdvi || 0), 0) /
            validData.length
          ).toFixed(4)
        )
      : null;

  const peakPoint =
    validData.length > 0
      ? [...validData].sort((a, b) => (b.avgNdvi || 0) - (a.avgNdvi || 0))[0]
      : null;

  const lowestPoint =
    validData.length > 0
      ? [...validData].sort((a, b) => (a.avgNdvi || 0) - (b.avgNdvi || 0))[0]
      : null;

  let netChange5Yr: number | null = null;
  if (validData.length >= 2) {
    const first = validData[0].avgNdvi;
    const last = validData[validData.length - 1].avgNdvi;
    if (first !== null && last !== null && first !== 0) {
      netChange5Yr = Number((((last - first) / Math.abs(first)) * 100).toFixed(2));
    }
  }

  const getStatusColor = (val: number | null) => {
    if (val === null) return '#71717a';
    if (val > 0.8) return '#a3e635'; // Very Healthy
    if (val > 0.5) return '#10b981'; // Healthy
    if (val >= 0.2) return '#f59e0b'; // Low/Moderate
    return '#f43f5e'; // Very Low
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-[#070C08]/95 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs space-y-1.5 min-w-[210px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white text-sm">Year {label}</span>
            <span className="text-[11px] text-zinc-400">Harmonized S2</span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-eco-neon font-semibold">Average NDVI:</span>
              <span className="font-bold text-white">
                {dataPoint.avgNdvi !== null ? dataPoint.avgNdvi : 'No Data'}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-emerald-400">Maximum NDVI:</span>
              <span>{dataPoint.maxNdvi !== null ? dataPoint.maxNdvi : 'No Data'}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-cyan-400">Minimum NDVI:</span>
              <span>{dataPoint.minNdvi !== null ? dataPoint.minNdvi : 'No Data'}</span>
            </div>

            {dataPoint.yoyChange !== null && (
              <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
                <span>YoY Change:</span>
                <span
                  className={`font-semibold ${
                    dataPoint.yoyChange > 0
                      ? 'text-emerald-400'
                      : dataPoint.yoyChange < 0
                      ? 'text-rose-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {dataPoint.yoyChange > 0 ? '+' : ''}
                  {dataPoint.yoyChange}%
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-zinc-400">Vegetation Class:</span>
              <span
                className="font-medium"
                style={{ color: getStatusColor(dataPoint.avgNdvi) }}
              >
                {dataPoint.status}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header Bar with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-eco-neon" />
            <span>5-Year Multi-Temporal NDVI Comparison</span>
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            {areaName} &bull; Calendar Years 2021 &ndash; 2025 (Sentinel-2 L2A Surface Reflectance)
          </p>
        </div>

        {/* Line vs Bar View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10 self-start sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setChartMode('line')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              chartMode === 'line'
                ? 'bg-eco-neon text-black font-semibold shadow-[0_0_12px_rgba(198,241,53,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Trajectory Line</span>
          </button>

          <button
            type="button"
            onClick={() => setChartMode('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              chartMode === 'bar'
                ? 'bg-eco-neon text-black font-semibold shadow-[0_0_12px_rgba(198,241,53,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Annual Bars</span>
          </button>
        </div>
      </div>

      {/* 5-Year Statistical Comparison Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-eco-neon" />
            5-Year Mean NDVI
          </span>
          <p className="text-lg font-bold text-white">
            {avg5Year !== null ? avg5Year.toFixed(4) : 'N/A'}
          </p>
          <span className="text-[11px] text-zinc-500">
            Baseline canopy average
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            Peak Year ({peakPoint?.year || '—'})
          </span>
          <p className="text-lg font-bold text-emerald-400">
            {peakPoint?.avgNdvi !== null && peakPoint?.avgNdvi !== undefined
              ? peakPoint.avgNdvi.toFixed(4)
              : 'N/A'}
          </p>
          <span className="text-[11px] text-zinc-500">
            Highest vegetation density
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Minus className="w-3 h-3 text-cyan-400" />
            Lowest Year ({lowestPoint?.year || '—'})
          </span>
          <p className="text-lg font-bold text-cyan-400">
            {lowestPoint?.avgNdvi !== null && lowestPoint?.avgNdvi !== undefined
              ? lowestPoint.avgNdvi.toFixed(4)
              : 'N/A'}
          </p>
          <span className="text-[11px] text-zinc-500">
            Leanest observed canopy
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            {netChange5Yr !== null && netChange5Yr > 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : netChange5Yr !== null && netChange5Yr < 0 ? (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            ) : (
              <Activity className="w-3 h-3 text-eco-neon" />
            )}
            5-Yr Net Trend
          </span>
          <p
            className={`text-lg font-bold ${
              netChange5Yr !== null && netChange5Yr > 0
                ? 'text-emerald-400'
                : netChange5Yr !== null && netChange5Yr < 0
                ? 'text-rose-400'
                : 'text-zinc-200'
            }`}
          >
            {netChange5Yr !== null
              ? `${netChange5Yr > 0 ? '+' : ''}${netChange5Yr}%`
              : 'Stable'}
          </p>
          <span className="text-[11px] text-zinc-500">
            2021 &rarr; 2025 net trajectory
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[320px] sm:h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'line' ? (
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
              />
              <XAxis
                dataKey="year"
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 12, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#27272A' }}
              />
              <YAxis
                domain={[-0.1, 1.0]}
                ticks={[-0.1, 0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0]}
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#27272A' }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Ecological Threshold Guidelines */}
              <ReferenceLine
                y={0.8}
                stroke="#A3E635"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: 'Very Healthy (>0.8)',
                  position: 'right',
                  fill: '#A3E635',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              <ReferenceLine
                y={0.5}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: 'Healthy (>0.5)',
                  position: 'right',
                  fill: '#10B981',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              <ReferenceLine
                y={0.2}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: 'Low/Moderate (>0.2)',
                  position: 'right',
                  fill: '#F59E0B',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              {/* Data Lines */}
              <Line
                type="monotone"
                dataKey="avgNdvi"
                name="Average NDVI"
                stroke="#C6F135"
                strokeWidth={3}
                dot={{
                  fill: '#C6F135',
                  stroke: '#070C08',
                  strokeWidth: 2,
                  r: 5,
                }}
                activeDot={{
                  r: 8,
                  fill: '#C6F135',
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="maxNdvi"
                name="Maximum NDVI"
                stroke="#10B981"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="minNdvi"
                name="Minimum NDVI"
                stroke="#38BDF8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                connectNulls
              />
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
              />
              <XAxis
                dataKey="year"
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 12, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#27272A' }}
              />
              <YAxis
                domain={[0, 1.0]}
                ticks={[0.0, 0.2, 0.4, 0.5, 0.6, 0.8, 1.0]}
                stroke="#71717A"
                tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#27272A' }}
              />
              <Tooltip content={<CustomTooltip />} />

              <ReferenceLine
                y={0.5}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: 'Healthy Baseline (0.5)',
                  position: 'right',
                  fill: '#10B981',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
              <ReferenceLine
                y={0.2}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
                label={{
                  value: 'Threshold (0.2)',
                  position: 'right',
                  fill: '#F59E0B',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              <Bar
                dataKey="avgNdvi"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getStatusColor(entry.avgNdvi)}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Scientific Notation Footer */}
      <div className="pt-2 text-[11px] font-mono text-zinc-500 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-eco-neon inline-block" />
            <span>Mean NDVI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 border-t border-dashed inline-block" />
            <span>Max Peak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 border-t border-dashed inline-block" />
            <span>Min Baseline</span>
          </div>
        </div>

        <span>Normalized Difference Vegetation Index Formula: (B8 - B4) / (B8 + B4)</span>
      </div>
    </div>
  );
}
