'use client';

import React, { useState } from 'react';
import {
  CloudRain,
  Sun,
  Droplets,
  AlertTriangle,
  Waves,
  Sprout,
  TrendingDown,
  Info,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Flame,
  Activity,
  Layers,
  ThermometerSun,
  History,
  Bug,
} from 'lucide-react';
import { DroughtPrediction } from '@/lib/types';

interface ClimateDisasterPredictorProps {
  prediction?: DroughtPrediction;
  areaName: string;
  state?: string;
  onDrilldownWeekly?: () => void;
}

export function ClimateDisasterPredictor({
  prediction,
  areaName,
  state,
  onDrilldownWeekly,
}: ClimateDisasterPredictorProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'wet_drought' | 'dry_drought' | 'heatwave' | 'climate_physics'>('live');

  const liveDisaster = prediction?.disasterType || prediction?.droughtType || 'Normal / Optimal Season';
  const isWetDrought = liveDisaster === 'Wet Drought & Crop Waterlogging';
  const isDryDrought = liveDisaster === 'Dry Agricultural Drought';
  const isPestDamage = liveDisaster === 'Sudden Pest Blight / Crop Damage';

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 space-y-6 shadow-[0_0_30px_rgba(0,0,0,0.35)] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-950/50 border border-eco-500/40 text-eco-neon flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-eco-neon animate-pulse" />
              Live Climate &amp; Natural Disaster Engine
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 border border-white/10">
              Multi-Year Satellite Telemetry Comparison
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <span>Climate Disaster Forecaster: Wet vs. Dry Drought &amp; Extreme Events</span>
          </h3>
          <p className="text-xs text-zinc-300 font-mono mt-0.5">
            Compares live satellite Sentinel-2 NDVI, CHIRPS rainfall, and multi-year baselines to detect{' '}
            <strong className="text-cyan-300">Wet Drought (Excess Rain Rot)</strong> vs.{' '}
            <strong className="text-amber-300">Dry Drought (Aridity Stress)</strong> for {areaName}.
          </p>
        </div>

        {/* Live Satellite Classification Badge */}
        <div className="shrink-0 flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-3 px-4 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase">Current Telemetry Diagnosis</span>
            <span
              className={`text-sm sm:text-base font-black ${
                isWetDrought
                  ? 'text-cyan-400'
                  : isDryDrought
                  ? 'text-rose-400'
                  : isPestDamage
                  ? 'text-yellow-400'
                  : 'text-emerald-400'
              }`}
            >
              {liveDisaster}
            </span>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg border ${
              isWetDrought
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : isDryDrought
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : isPestDamage
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isWetDrought ? (
              <CloudRain className="w-6 h-6" />
            ) : isDryDrought ? (
              <Sun className="w-6 h-6" />
            ) : isPestDamage ? (
              <Bug className="w-6 h-6" />
            ) : (
              <Sprout className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>

      {/* ── Interactive View / Simulation Mode Tabs ───────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'live'
              ? 'bg-eco-neon text-black font-bold shadow-md shadow-eco-neon/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>🛰️ Live Diagnosis ({areaName})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wet_drought')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'wet_drought'
              ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>🌧️ Wet Drought &amp; Inundation Scenario</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dry_drought')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'dry_drought'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>☀️ Dry Agricultural Drought Scenario</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heatwave')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'heatwave'
              ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>🔥 Heatwave &amp; Thermal Stress</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('climate_physics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'climate_physics'
              ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>📊 How Rain Dynamically Alters NDVI</span>
        </button>
      </div>

      {/* ── TAB 1: LIVE DIAGNOSIS ─────────────────────────────────────── */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono">
            {/* Box 1: Rainfall Signature */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                Rainfall &amp; Climate Pattern
              </span>
              <div className="text-sm font-bold text-white">
                {prediction?.rainfallStressIndex || 'Normal Moisture'}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {prediction?.climateDynamics?.rainfallPattern ||
                  'Monitored via UCSB-CHG CHIRPS daily precipitation and multi-year normal baselines.'}
              </p>
            </div>

            {/* Box 2: Soil Moisture Dynamics */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-eco-neon" />
                Soil Saturation &amp; Root Aeration
              </span>
              <div className="text-sm font-bold text-white">
                {isWetDrought
                  ? 'Waterlogged / Anaerobic Root Zone'
                  : isDryDrought
                  ? 'Severe Moisture Deficit / Cracking'
                  : 'Balanced Field Capacity'}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {prediction?.climateDynamics?.soilMoistureStatus ||
                  'Soil maintains healthy capillary moisture without root asphyxiation.'}
              </p>
            </div>

            {/* Box 3: NDVI Impact Mechanism */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                Spectral NDVI Reaction
              </span>
              <div className="text-sm font-bold text-white">
                VCI: {prediction?.vci?.toFixed(1) ?? 50}% &bull; NDVI: {prediction?.currentNdvi?.toFixed(3) ?? 0.35}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {prediction?.climateDynamics?.ndviSignatureExplanation ||
                  'Active chlorophyll absorption and near-infrared reflectance indicate stable vegetative vigor.'}
              </p>
            </div>
          </div>

          {/* Historical Precedent Banner */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-amber-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                Multi-Year Historical Comparison
              </span>
              <p className="text-zinc-300">
                {prediction?.climateDynamics?.historicalPrecedent ||
                  'Comparing current observation against multi-year disaster baselines including 2018 drought and 2022 wet rot events.'}
              </p>
            </div>

            {onDrilldownWeekly && (
              <button
                type="button"
                onClick={onDrilldownWeekly}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white font-mono text-[11px] transition-all"
              >
                <span>Inspect Weekly Timeline</span>
                <ArrowRight className="w-3.5 h-3.5 text-eco-neon" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: WET DROUGHT DEEP DIVE ──────────────────────────────── */}
      {activeTab === 'wet_drought' && (
        <div className="space-y-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 p-4">
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-bold">
            <CloudRain className="w-5 h-5 text-cyan-400" />
            <span>Wet Drought (Continuous Excess Rain &amp; Crop Waterlogging Disaster) Explained</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            A <strong>Wet Drought</strong> occurs when continuous unseasonal torrential downpours flood agricultural fields.
            In clay-heavy soils (such as black cotton soils), water cannot percolate rapidly, leading to prolonged waterlogging.
            Even though precipitation is in large surplus, <strong>crop roots choke from lack of oxygen (anaerobic asphyxiation), fungal collar rot sets in, and standing crops lodge flat into mud</strong>.
            On satellite imagery, surface standing water absorbs Near-Infrared (NIR) radiation, causing an <strong>anomalous, abrupt collapse in NDVI</strong> that mimics extreme drought damage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-black/40 border border-cyan-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Historical Benchmark (October 2022 &amp; 2024 Inundation)
              </span>
              <p className="text-zinc-300 leading-relaxed">
                During retreating monsoon downpours, continuous heavy rains caused mature soybean pods to sprout on the stalk and cotton bolls to rot.
                Satellite NDVI dropped abruptly by <strong>18% to 26%</strong> across 14 days despite continuous surplus precipitation.
              </p>
            </div>

            <div className="rounded-lg bg-black/40 border border-cyan-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-eco-neon" />
                Wet Drought Actionable Countermeasures
              </span>
              <ul className="text-zinc-300 space-y-1 list-disc list-inside">
                <li>Dig 30 cm deep drainage trenches every 10 meters immediately to evacuate standing water within 24–48 hours.</li>
                <li>Drench root zones with Copper Oxychloride (2.5 g/L) or Carbendazim against fungal root rot.</li>
                <li>Halt urea fertilizer applications in waterlogged soils; spray foliar 19:19:19 once surface drains.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: DRY DROUGHT DEEP DIVE ──────────────────────────────── */}
      {activeTab === 'dry_drought' && (
        <div className="space-y-4 rounded-xl bg-amber-950/20 border border-amber-500/30 p-4">
          <div className="flex items-center gap-2 text-amber-300 font-mono text-sm font-bold">
            <Sun className="w-5 h-5 text-amber-400" />
            <span>Dry Agricultural Drought (Meteorological &amp; Soil Moisture Deficit) Explained</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            <strong>Dry Agricultural Drought</strong> is triggered by prolonged monsoon dry breaks (20+ days without rain), cumulative rainfall deficits exceeding -30% to -60%,
            and intense solar evapotranspiration. Soil moisture drops below the permanent wilting point, crop foliage loses cellular turgor, and chlorophyll disintegrates.
            On satellite telemetry, this appears as a <strong>steady, monotonic week-over-week NDVI decline</strong> across 4 to 12 consecutive weeks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-black/40 border border-amber-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Historical Benchmark (2018 Drought &amp; August 2023 Hiatus)
              </span>
              <p className="text-zinc-300 leading-relaxed">
                In August 2023, a 22-day rain hiatus broke a 122-year record with an 80% monsoon hiatus. In 2018, severe drought across 151 talukas saw NDVI fall below 0.28,
                collapsing 42% of kharif pulse yields and necessitating 6,200+ emergency water tankers.
              </p>
            </div>

            <div className="rounded-lg bg-black/40 border border-amber-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-eco-neon" />
                Dry Drought Actionable Countermeasures
              </span>
              <ul className="text-zinc-300 space-y-1 list-disc list-inside">
                <li>Enforce nocturnal micro-irrigation (drip / sprinkler) between 8 PM and 6 AM to stop daytime evaporation.</li>
                <li>Apply 5–7 cm organic biomass / crop residue mulching along crop rows to conserve root capillary reserves.</li>
                <li>Deploy a 1–2% Potassium Nitrate (KNO3) foliar spray to induce crop osmotic resistance under heat.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: HEATWAVE & THERMAL STRESS ───────────────────────────── */}
      {activeTab === 'heatwave' && (
        <div className="space-y-4 rounded-xl bg-rose-950/20 border border-rose-500/30 p-4">
          <div className="flex items-center gap-2 text-rose-300 font-mono text-sm font-bold">
            <Flame className="w-5 h-5 text-rose-400" />
            <span>Extreme Heatwave &amp; Thermal Canopy Stress Explained</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            Extreme heatwave episodes occur when Land Surface Temperatures (LST) surge +2.5°C to +5.0°C above historical norms.
            Plants close their stomata to prevent dehydration, shutting down photosynthesis and leading to cellular thermal scorching.
            Satellite sensors observe a sudden loss in photosynthetic efficiency and thermal reflectance spikes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-black/40 border border-rose-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <ThermometerSun className="w-3.5 h-3.5" />
                Satellite Telemetry Signals
              </span>
              <p className="text-zinc-300 leading-relaxed">
                Elevated MODIS Land Surface Temperature paired with sharp downward NDVI slope within 7–10 days.
                Even if soil moisture was previously adequate, intense thermal radiation scorches top foliage.
              </p>
            </div>

            <div className="rounded-lg bg-black/40 border border-rose-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-rose-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-eco-neon" />
                Thermal Protection Advisories
              </span>
              <ul className="text-zinc-300 space-y-1 list-disc list-inside">
                <li>Deploy micro-sprinklers during peak afternoon hours (12 PM – 3 PM) for evaporative canopy cooling.</li>
                <li>Apply Kaolin clay spray (5%) to reflect excess solar radiation without harming leaf respiration.</li>
                <li>Erect shade netting for high-value horticultural and vegetable plantations.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: HOW RAIN DYNAMICALLY ALTERS NDVI (STEP-BY-STEP PHYSICS) ─ */}
      {activeTab === 'climate_physics' && (
        <div className="space-y-4 rounded-xl bg-purple-950/20 border border-purple-500/30 p-4">
          <div className="flex items-center gap-2 text-purple-300 font-mono text-sm font-bold">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>How Rainfall &amp; Climate Dynamically Alter Satellite NDVI</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            NDVI measures active chlorophyll reflectance using the formula: <code className="text-eco-neon font-mono text-[11px]">(NIR - Red) / (NIR + Red)</code>.
            Here is the step-by-step physical breakdown of why NDVI reacts differently during <strong>Continuous Rainfall (Wet Drought)</strong> versus a <strong>Rain Hiatus (Dry Drought)</strong>:
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {/* Scenario A: Continuous Rain */}
            <div className="rounded-xl bg-black/50 border border-cyan-500/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300 border-b border-cyan-500/20 pb-2">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-cyan-400" />
                  Scenario 1: Continuous Heavy Rainfall
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">Wet Inundation</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">Days 1–3:</span>
                  <span className="text-zinc-300">Soil reaches 100% water saturation and field capacity.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">Days 4–10:</span>
                  <span className="text-zinc-300">Standing surface water accumulates; root zones become completely anaerobic (zero oxygen).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">Days 11+:</span>
                  <span className="text-zinc-300">Root rot develops; crop stems lodge flat into muddy water.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px]">
                  <strong>🛰️ Satellite NDVI Effect:</strong> Standing water absorbs Near-Infrared (NIR) energy and rotting leaves lose chlorophyll. <strong>NDVI drops sharply from ~0.55 down to 0.30 despite rainfall surplus!</strong>
                </div>
              </div>
            </div>

            {/* Scenario B: Rain Hiatus */}
            <div className="rounded-xl bg-black/50 border border-amber-500/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 border-b border-amber-500/20 pb-2">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Scenario 2: Prolonged Rainless Break
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Dry Drought</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">Weeks 1–2:</span>
                  <span className="text-zinc-300">Topsoil moisture completely evaporates; soil fissures and deep cracks appear.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">Weeks 3–4:</span>
                  <span className="text-zinc-300">Capillary suction fails; plants reach permanent wilting point with leaf curling.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">Weeks 5+:</span>
                  <span className="text-zinc-300">Chlorophyll degrades and foliage turns straw brown.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px]">
                  <strong>🛰️ Satellite NDVI Effect:</strong> Gradual, steady monotonic weekly decline in NDVI across consecutive weeks (e.g. 0.48 &rarr; 0.40 &rarr; 0.32).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
