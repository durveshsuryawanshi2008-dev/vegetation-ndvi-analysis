'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { YearlyNdviResult } from '@/lib/types';
import { Activity } from 'lucide-react';

interface NdviChartProps {
  years: YearlyNdviResult[];
  areaName: string;
}

export function NdviChart({ years, areaName }: NdviChartProps) {
  // Format data for Recharts
  const chartData = years.map((item) => ({
    year: item.year.toString(),
    avgNdvi: item.avgNdvi !== null ? Number(item.avgNdvi.toFixed(4)) : null,
    minNdvi: item.minNdvi !== null ? Number(item.minNdvi.toFixed(4)) : null,
    maxNdvi: item.maxNdvi !== null ? Number(item.maxNdvi.toFixed(4)) : null,
    status: item.vegetationStatus,
    imageCount: item.imageCount,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="rounded-xl border border-white/10 bg-[#070C08]/95 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white text-sm">Year {label}</span>
            <span className="text-[11px] text-zinc-400">Sentinel-2 SR</span>
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
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-zinc-400">Status:</span>
              <span className="text-white font-medium">{dataPoint.status}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-eco-neon" />
            <span>5-Year NDVI Multi-Temporal Trajectory</span>
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            {areaName} &bull; Calendar Years 2021 &ndash; 2025 (Harmonized Sentinel-2 SR)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-eco-neon inline-block" />
            <span>Mean NDVI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 border-t border-dashed inline-block" />
            <span>Max</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 border-t border-dashed inline-block" />
            <span>Min</span>
          </div>
        </div>
      </div>

      <div className="h-[320px] sm:h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
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
              dot={{ fill: '#C6F135', stroke: '#070C08', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, fill: '#C6F135', stroke: '#FFFFFF', strokeWidth: 2 }}
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
        </ResponsiveContainer>
      </div>

      <div className="pt-2 text-[11px] font-mono text-zinc-500 flex flex-wrap items-center justify-between gap-2 border-t border-white/5">
        <span>Sentinel-2 Level-2A (SR) &bull; Band 8 NIR (842 nm) &amp; Band 4 Red (665 nm)</span>
        <span>Standardized Difference Index Range [-1.0, 1.0]</span>
      </div>
    </div>
  );
}
