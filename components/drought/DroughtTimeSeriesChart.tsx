'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  WeeklyNdviSeries,
  MonthlyNdviSeries,
  SeasonalNdviSeries,
  YearlyNdviResult,
} from '@/lib/types';
import {
  Calendar,
  CalendarDays,
  Clock,
  Layers,
  Activity,
} from 'lucide-react';

interface DroughtTimeSeriesChartProps {
  weeklySeries: WeeklyNdviSeries[];
  monthlySeries: MonthlyNdviSeries[];
  seasonalSeries: SeasonalNdviSeries[];
  yearlySeries: YearlyNdviResult[];
  areaName: string;
}

export function DroughtTimeSeriesChart({
  weeklySeries,
  monthlySeries,
  seasonalSeries,
  yearlySeries,
  areaName,
}: DroughtTimeSeriesChartProps) {
  const [granularity, setGranularity] = useState<'monthly' | 'weekly' | 'seasonal' | 'yearly'>('monthly');

  // Format data based on selected granularity
  let chartData: any[] = [];
  if (granularity === 'monthly') {
    chartData = monthlySeries.map((m) => ({
      label: m.label,
      currentNdvi: m.currentNdvi,
      previousMonthNdvi: m.previousMonthNdvi,
      sameMonthLastYearNdvi: m.sameMonthLastYearNdvi,
      fiveYearAvgNdvi: m.fiveYearAvgNdvi,
      vci: m.vci,
      anomalyPercent: m.anomalyPercent,
    }));
  } else if (granularity === 'weekly') {
    chartData = weeklySeries.map((w) => ({
      label: w.label,
      currentNdvi: w.currentNdvi,
      fiveYearAvgNdvi: w.historicalAvgNdvi,
      vci: w.vci,
      anomalyPercent: w.anomalyPercent,
    }));
  } else if (granularity === 'seasonal') {
    chartData = seasonalSeries.map((s) => ({
      label: s.label,
      currentNdvi: s.avgNdvi,
      rainfallMm: s.rainfallMm,
      rainfallDeficitPercent: s.rainfallDeficitPercent,
    }));
  } else {
    chartData = yearlySeries.map((y) => ({
      label: y.year.toString(),
      currentNdvi: y.avgNdvi,
      minNdvi: y.minNdvi,
      maxNdvi: y.maxNdvi,
    }));
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-[#070C08]/95 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs space-y-1.5 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white text-sm">{label}</span>
            <span className="text-[10px] text-zinc-400">Sentinel-2 MSI</span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-eco-neon font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-eco-neon" />
                Current NDVI:
              </span>
              <span className="font-bold text-white">
                {p.currentNdvi !== null && p.currentNdvi !== undefined ? p.currentNdvi : 'N/A'}
              </span>
            </div>

            {p.previousMonthNdvi !== undefined && p.previousMonthNdvi !== null && (
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Previous Month:
                </span>
                <span>{p.previousMonthNdvi}</span>
              </div>
            )}

            {p.sameMonthLastYearNdvi !== undefined && p.sameMonthLastYearNdvi !== null && (
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Same Month Last Year:
                </span>
                <span>{p.sameMonthLastYearNdvi}</span>
              </div>
            )}

            {p.fiveYearAvgNdvi !== undefined && p.fiveYearAvgNdvi !== null && (
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  5-Yr Same-Period Avg:
                </span>
                <span>{p.fiveYearAvgNdvi}</span>
              </div>
            )}

            {p.vci !== undefined && p.vci !== null && (
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-zinc-400">Vegetation Condition (VCI):</span>
                <span className="font-bold text-cyan-300">{p.vci}%</span>
              </div>
            )}

            {p.anomalyPercent !== undefined && p.anomalyPercent !== null && (
              <div className="flex items-center justify-between text-zinc-400">
                <span>NDVI Anomaly:</span>
                <span className={p.anomalyPercent < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {p.anomalyPercent > 0 ? '+' : ''}{p.anomalyPercent}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-5">
      {/* Header Bar & Granularity Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-eco-neon" />
            <span>Multi-Temporal NDVI Time Series &amp; Historical Trajectory</span>
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            {areaName} &bull; Sentinel-2 Surface Reflectance (BOA) with same-period historical benchmarks
          </p>
        </div>

        {/* 4-Way Granularity Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setGranularity('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              granularity === 'monthly'
                ? 'bg-eco-neon text-black font-semibold shadow-[0_0_12px_rgba(198,241,53,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly</span>
          </button>

          <button
            type="button"
            onClick={() => setGranularity('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              granularity === 'weekly'
                ? 'bg-eco-neon text-black font-semibold shadow-[0_0_12px_rgba(198,241,53,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Weekly</span>
          </button>

          <button
            type="button"
            onClick={() => setGranularity('seasonal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              granularity === 'seasonal'
                ? 'bg-eco-neon text-black font-semibold shadow-[0_0_12px_rgba(198,241,53,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Seasonal</span>
          </button>

          <button
            type="button"
            onClick={() => setGranularity('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              granularity === 'yearly'
                ? 'bg-eco-neon text-black font-semibold shadow-[0_0_12px_rgba(198,241,53,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Yearly</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[340px] sm:h-[400px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis
              dataKey="label"
              stroke="#71717A"
              tick={{ fill: '#A1A1AA', fontSize: 11, fontFamily: 'monospace' }}
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
            <Legend
              wrapperStyle={{
                fontFamily: 'monospace',
                fontSize: '11px',
                paddingTop: '10px',
              }}
            />

            {/* Threshold References */}
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
                value: 'Drought Threshold (0.2)',
                position: 'right',
                fill: '#F59E0B',
                fontSize: 10,
                fontFamily: 'monospace',
              }}
            />

            {/* 1. Current NDVI (Prominent Glowing Line) */}
            <Line
              type="monotone"
              dataKey="currentNdvi"
              name="Current NDVI"
              stroke="#C6F135"
              strokeWidth={3}
              dot={{ fill: '#C6F135', stroke: '#070C08', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: '#C6F135', stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls
            />

            {/* 2. Previous Month NDVI */}
            {granularity === 'monthly' && (
              <Line
                type="monotone"
                dataKey="previousMonthNdvi"
                name="Previous Month"
                stroke="#38BDF8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ fill: '#38BDF8', r: 3 }}
                connectNulls
              />
            )}

            {/* 3. Same Month Last Year (2023) */}
            {granularity === 'monthly' && (
              <Line
                type="monotone"
                dataKey="sameMonthLastYearNdvi"
                name="Same Month Last Year"
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={{ fill: '#F59E0B', r: 3 }}
                connectNulls
              />
            )}

            {/* 4. 5-Year Same-Period Historical Average */}
            {(granularity === 'monthly' || granularity === 'weekly') && (
              <Line
                type="monotone"
                dataKey="fiveYearAvgNdvi"
                name="5-Year Historical Baseline"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Scientific Explanation */}
      <div className="pt-2 text-[11px] font-mono text-zinc-500 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
        <span>
          Comparing observed Sentinel-2 canopy vigor against the exact same calendar week/month across 5 historical years.
        </span>
        <span className="text-zinc-400">
          Formula: <code className="text-zinc-300">NDVI Anomaly = Current - 5Yr Baseline</code>
        </span>
      </div>
    </div>
  );
}
