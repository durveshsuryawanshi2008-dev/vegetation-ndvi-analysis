import React from 'react';
import { YearlyNdviResult } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { Table, Calendar, Eye } from 'lucide-react';

interface YearlyTableProps {
  years: YearlyNdviResult[];
}

export function YearlyTable({ years }: YearlyTableProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-eco-neon" />
            <span>Annual NDVI Breakdown (2021 &ndash; 2025)</span>
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            Derived from cloud-screened multi-spectral Sentinel-2 Harmonized assets
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm font-mono">
          <thead>
            <tr className="border-b border-white/10 text-zinc-400 uppercase text-[11px] tracking-wider">
              <th className="py-3 px-3">Calendar Year</th>
              <th className="py-3 px-3 text-right">Avg NDVI</th>
              <th className="py-3 px-3 text-right">Min NDVI</th>
              <th className="py-3 px-3 text-right">Max NDVI</th>
              <th className="py-3 px-3 text-center">Vegetation Status</th>
              <th className="py-3 px-3 text-right">S2 Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            {years.map((row) => (
              <tr key={row.year} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{row.year}</span>
                </td>
                <td className="py-3.5 px-3 text-right font-bold text-eco-neon text-sm sm:text-base">
                  {row.avgNdvi !== null ? row.avgNdvi.toFixed(4) : (
                    <span className="text-zinc-600 font-normal italic">No Data</span>
                  )}
                </td>
                <td className="py-3.5 px-3 text-right text-zinc-400">
                  {row.minNdvi !== null ? row.minNdvi.toFixed(4) : '-'}
                </td>
                <td className="py-3.5 px-3 text-right text-zinc-400">
                  {row.maxNdvi !== null ? row.maxNdvi.toFixed(4) : '-'}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <StatusBadge status={row.vegetationStatus} size="sm" />
                </td>
                <td className="py-3.5 px-3 text-right text-zinc-400 text-xs">
                  {row.imageCount !== undefined ? `${row.imageCount} tiles` : 'Cloud filtered'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
        <span>Cloud cover threshold: &lt; 30% with SCL scene classification masking</span>
        <span>Reducers: Mean, Min, Max</span>
      </div>
    </div>
  );
}
