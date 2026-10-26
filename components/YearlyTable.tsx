import React from 'react';
import { YearlyNdviResult } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { Table, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface YearlyTableProps {
  years: YearlyNdviResult[];
}

export function YearlyTable({ years }: YearlyTableProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.3)]">
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
              <th className="py-3 px-3">Vegetation Density</th>
              <th className="py-3 px-3 text-right">YoY Delta</th>
              <th className="py-3 px-3 text-right">Min / Max Range</th>
              <th className="py-3 px-3 text-center">Vegetation Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-zinc-300">
            {years.map((row, idx) => {
              const prev = idx > 0 ? years[idx - 1] : null;
              let yoyDiff: number | null = null;
              if (
                row.avgNdvi !== null &&
                prev !== null &&
                prev.avgNdvi !== null &&
                prev.avgNdvi !== 0
              ) {
                yoyDiff = Number(
                  (
                    ((row.avgNdvi - prev.avgNdvi) / Math.abs(prev.avgNdvi)) *
                    100
                  ).toFixed(1)
                );
              }

              const barWidth = row.avgNdvi !== null ? Math.max(0, Math.min(100, Math.round(row.avgNdvi * 100))) : 0;

              return (
                <tr key={row.year} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{row.year}</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold text-eco-neon text-sm sm:text-base">
                    {row.avgNdvi !== null ? (
                      row.avgNdvi.toFixed(4)
                    ) : (
                      <span className="text-zinc-600 font-normal italic">No Data</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 w-40">
                    <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-eco-neon h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {yoyDiff !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          yoyDiff > 0
                            ? 'text-emerald-400'
                            : yoyDiff < 0
                            ? 'text-rose-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {yoyDiff > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : yoyDiff < 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {yoyDiff > 0 ? `+${yoyDiff}%` : `${yoyDiff}%`}
                      </span>
                    ) : (
                      <span className="text-zinc-600 font-normal">&mdash;</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right text-zinc-400 text-xs">
                    {row.minNdvi !== null && row.maxNdvi !== null ? (
                      <span>
                        [{row.minNdvi.toFixed(2)} to {row.maxNdvi.toFixed(2)}]
                      </span>
                    ) : (
                      <span>&mdash;</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <StatusBadge status={row.vegetationStatus} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-2 text-[11px] font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/5">
        <span>Cloud cover threshold: &lt; 30% with SCL scene classification masking</span>
        <span>Multispectral Index: (B8 - B4) / (B8 + B4)</span>
      </div>
    </div>
  );
}
