'use client';

import React from 'react';
import { DroughtRiskCategory } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Droplets, Thermometer, Sprout, Info } from 'lucide-react';

interface Props {
  riskCategory: DroughtRiskCategory;
  advisories: string[];
  area: string;
}

const categoryConfig: Record<
  DroughtRiskCategory,
  { icon: React.ReactNode; color: string; bg: string; border: string; dot: string }
> = {
  'No drought': {
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-700/40',
    dot: 'bg-emerald-400',
  },
  'Mild drought risk': {
    icon: <Info className="w-5 h-5" />,
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-700/40',
    dot: 'bg-yellow-400',
  },
  'Moderate drought risk': {
    icon: <Droplets className="w-5 h-5" />,
    color: 'text-orange-400',
    bg: 'bg-orange-950/40',
    border: 'border-orange-700/40',
    dot: 'bg-orange-400',
  },
  'High drought risk': {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-red-400',
    bg: 'bg-red-950/40',
    border: 'border-red-700/40',
    dot: 'bg-red-400',
  },
  'Severe drought risk': {
    icon: <Thermometer className="w-5 h-5" />,
    color: 'text-rose-400',
    bg: 'bg-rose-950/40',
    border: 'border-rose-700/40',
    dot: 'bg-rose-400',
  },
};

const mahaSeasons = [
  { name: 'Kharif (Monsoon)', months: 'Jun – Oct', crops: 'Soybean, Jowar, Cotton, Bajra' },
  { name: 'Rabi (Winter)', months: 'Nov – Feb', crops: 'Chickpea, Wheat, Safflower, Onion' },
  { name: 'Summer / Zaid', months: 'Mar – May', crops: 'Sunflower, Maize, Fodder, Green Gram' },
];

export function DroughtAdvisoryPanel({ riskCategory, advisories, area }: Props) {
  const cfg = categoryConfig[riskCategory] ?? categoryConfig['No drought'];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#0D1B0F]/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 border-b ${cfg.border} ${cfg.bg} flex items-center gap-3`}>
        <span className={cfg.color}>{cfg.icon}</span>
        <div>
          <h3 className={`text-sm font-semibold ${cfg.color}`}>Agricultural Advisory — {riskCategory}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tailored recommendations for <span className="text-white font-medium">{area}</span>, Maharashtra
          </p>
        </div>
        <span className={`ml-auto w-2.5 h-2.5 rounded-full animate-pulse ${cfg.dot}`} />
      </div>

      {/* Advisories */}
      <div className="p-5 space-y-3">
        {advisories.length === 0 ? (
          <p className="text-zinc-500 text-sm">No specific advisories at this time.</p>
        ) : (
          advisories.map((advisory, i) => (
            <div
              key={i}
              className="flex gap-3 items-start p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-all"
            >
              <div className={`w-6 h-6 rounded-full ${cfg.bg} ${cfg.border} border flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className={`text-[10px] font-bold font-mono ${cfg.color}`}>{i + 1}</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{advisory}</p>
            </div>
          ))
        )}
      </div>

      {/* Maharashtra Season Reference */}
      <div className="border-t border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sprout className="w-4 h-4 text-eco-neon" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide font-mono">Maharashtra Cropping Calendar</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mahaSeasons.map((s) => (
            <div
              key={s.name}
              className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <p className="text-xs font-semibold text-eco-neon">{s.name}</p>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{s.months}</p>
              <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">{s.crops}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data disclaimer */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-zinc-600 font-mono">
          ⊞ NDVI: COPERNICUS/S2_SR_HARMONIZED · Rainfall: UCSB-CHG/CHIRPS/DAILY · LST: MODIS/061/MOD11A2
        </p>
      </div>
    </div>
  );
}
