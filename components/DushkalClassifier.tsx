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
} from 'lucide-react';
import { DroughtPrediction } from '@/lib/types';

interface DushkalClassifierProps {
  prediction?: DroughtPrediction;
  areaName: string;
  state?: string;
  onDrilldownWeekly?: () => void;
}

export function DushkalClassifier({
  prediction,
  areaName,
  state,
  onDrilldownWeekly,
}: DushkalClassifierProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'ola' | 'suka' | 'climate_dynamics'>('live');

  const liveType = prediction?.droughtType || 'Normal / Optimal Season';
  const liveMarathi = prediction?.droughtTypeMarathi || 'सुरळीत हंगाम';
  const isLiveOla = liveType === 'Ola Dushkal (Wet Drought)';
  const isLiveSuka = liveType === 'Suka Dushkal (Dry Drought)';

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
              Maharashtra Climate Engine
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-300 border border-white/10">
              सुका दुष्काळ vs ओला दुष्काळ वर्गीकरण
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <span>Drought Nature: Ola Dushkal (Wet) vs Suka Dushkal (Dry)</span>
          </h3>
          <p className="text-xs text-zinc-300 font-mono mt-0.5">
            Differentiates crop devastation from <strong className="text-cyan-300">Continuous Excess Rainfall (ओला दुष्काळ)</strong> vs{' '}
            <strong className="text-amber-300">Prolonged Monsoon Drought (सुका दुष्काळ)</strong> for {areaName}.
          </p>
        </div>

        {/* Live Satellite Classification Badge */}
        <div className="shrink-0 flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-3 px-4 font-mono">
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase">Current Satellite Diagnosis</span>
            <span
              className={`text-base sm:text-lg font-black ${
                isLiveOla ? 'text-cyan-400' : isLiveSuka ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {liveMarathi} ({isLiveOla ? 'Wet Drought' : isLiveSuka ? 'Dry Drought' : 'Normal'})
            </span>
          </div>
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg border ${
              isLiveOla
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : isLiveSuka
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isLiveOla ? <CloudRain className="w-6 h-6" /> : isLiveSuka ? <Sun className="w-6 h-6" /> : <Sprout className="w-6 h-6" />}
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
          onClick={() => setActiveTab('ola')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'ola'
              ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>🌧️ ओला दुष्काळ (Wet Drought Scenario)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suka')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'suka'
              ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>☀️ सुका दुष्काळ (Dry Drought Scenario)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('climate_dynamics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
            activeTab === 'climate_dynamics'
              ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>📊 कसा बदलतो NDVI? (NDVI Climate Dynamics)</span>
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
                  'Monsoon rainfall monitored via UCSB-CHG CHIRPS & Sentinel-2 composite telemetry.'}
              </p>
            </div>

            {/* Box 2: Soil Moisture Dynamics */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-eco-neon" />
                Soil Saturation / Root Aeration
              </span>
              <div className="text-sm font-bold text-white">
                {isLiveOla ? 'Waterlogged / Anaerobic' : isLiveSuka ? 'Severe Moisture Deficit' : 'Optimal Field Capacity'}
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                {prediction?.climateDynamics?.soilMoistureStatus ||
                  'Black cotton soil holds capillary water without root asphyxiation.'}
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
                  'Canopy reflectance demonstrates standard chlorophyll absorption and near-infrared scattering.'}
              </p>
            </div>
          </div>

          {/* Historical Precedent Banner */}
          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-amber-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-400" />
                Maharashtra Climate Memory Comparison
              </span>
              <p className="text-zinc-300">
                {prediction?.climateDynamics?.historicalPrecedent ||
                  'Compares current season against Maharashtra 2022 Ola Dushkal (wet drought) and 2018/2023 Suka Dushkal (dry drought).'}
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

      {/* ── TAB 2: OLA DUSHKAL (WET DROUGHT) DEEP DIVE ─────────────────── */}
      {activeTab === 'ola' && (
        <div className="space-y-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 p-4">
          <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-bold">
            <CloudRain className="w-5 h-5 text-cyan-400" />
            <span>ओला दुष्काळ (Ola Dushkal / Excess Rain &amp; Waterlogging Disaster) Explained</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            In Maharashtra, <strong>Ola Dushkal</strong> occurs when continuous unseasonal torrential rains (such as retreating monsoon cloudbursts)
            flood agricultural fields. In heavy black cotton soil (काळी माती), water cannot percolate rapidly, leading to complete waterlogging.
            Even though rain is abundant, <strong>crops rot, roots choke from lack of oxygen (anaerobic asphyxiation), and plants collapse</strong>.
            On satellite imagery, standing water absorbs NIR radiation, causing a <strong>sudden anomalous NDVI drop</strong> mimicking drought loss!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-black/40 border border-cyan-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                What Happened Last Year in Maharashtra (2022 / 2024)?
              </span>
              <p className="text-zinc-300 leading-relaxed">
                In October 2022 &amp; late 2024, continuous rainfall in Marathwada (Latur, Beed, Nanded, Ahilyanagar) caused standing soybean pods to sprout and rot on the stalk.
                Cotton bolls turned black and dropped. NDVI dropped precipitously by <strong>18% to 26%</strong> across 2 weeks despite continuous rainfall!
              </p>
            </div>

            <div className="rounded-lg bg-black/40 border border-cyan-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-eco-neon" />
                ओला दुष्काळ उपाययोजना (Wet Drought Countermeasures)
              </span>
              <ul className="text-zinc-300 space-y-1 list-disc list-inside">
                <li>शेतातून साचलेले पाणी त्वरित बाहेर काढण्यासाठी 30 सेमी खोल चर (Drainage Trenches) काढा.</li>
                <li>मुळे कुजणे रोखण्यासाठी कॉपर ऑक्सिक्लोराईड (2.5g/L) किंवा कार्बेन्डाझिमची आळवणी करा.</li>
                <li>ओल्या जमिनीत युरियाचा वापर पूर्णपणे थांबवा; पाणी ओसरल्यावर 19:19:19 ची फवारणी करा.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SUKA DUSHKAL (DRY DROUGHT) DEEP DIVE ─────────────────── */}
      {activeTab === 'suka' && (
        <div className="space-y-4 rounded-xl bg-amber-950/20 border border-amber-500/30 p-4">
          <div className="flex items-center gap-2 text-amber-300 font-mono text-sm font-bold">
            <Sun className="w-5 h-5 text-amber-400" />
            <span>सुका दुष्काळ (Suka Dushkal / Meteorological &amp; Agricultural Drought) Explained</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            <strong>Suka Dushkal</strong> is the classic aridity drought triggered by prolonged dry spells (पावसाचा खंड), rain deficit exceeding -30% to -60%,
            and scorching land surface temperatures. Soil moisture drops below the permanent wilting point, crops wilt during midday, and chlorophyll degrades.
            On satellite imagery, this appears as a <strong>steady, monotonic week-over-week NDVI decline</strong> across 4 to 12 consecutive weeks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="rounded-lg bg-black/40 border border-amber-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Historical Benchmark (2018 &amp; August 2023)
              </span>
              <p className="text-zinc-300 leading-relaxed">
                In August 2023, a 22-day dry spell led to an 80% monsoon hiatus across Maharashtra. In 2018, 151 talukas faced extreme drought,
                with NDVI falling below 0.28, causing 42% kharif pulse collapse and requiring 6,200+ water tankers across Ahilyanagar and Solapur.
              </p>
            </div>

            <div className="rounded-lg bg-black/40 border border-amber-500/20 p-3 space-y-1.5 text-xs">
              <span className="font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-eco-neon" />
                सुका दुष्काळ उपाययोजना (Dry Drought Countermeasures)
              </span>
              <ul className="text-zinc-300 space-y-1 list-disc list-inside">
                <li>बाष्पीभवन टाळण्यासाठी केवळ रात्रीच्या किंवा पहाटेच्या वेळीच ठिबक/तुषार सिंचन वापरा.</li>
                <li>पिकाच्या ओळींमध्ये 5 ते 7 सेमी सेंद्रिय काडीकचऱ्याचे आच्छादन (Mulching) करा.</li>
                <li>उष्णतेचा ताण कमी करण्यासाठी 1% पोटॅशियम नायट्रेट (KNO₃) किंवा युरियाची हलकी फवारणी करा.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: HOW CLIMATE & CONTINUOUS RAIN CHANGES DAILY/WEEKLY NDVI ─ */}
      {activeTab === 'climate_dynamics' && (
        <div className="space-y-4 rounded-xl bg-purple-950/20 border border-purple-500/30 p-4">
          <div className="flex items-center gap-2 text-purple-300 font-mono text-sm font-bold">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>कसा बदलतो NDVI? (How Climate &amp; Rain Dynamically Modifies Satellite NDVI)</span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-sans">
            NDVI measures active chlorophyll reflectance via formula: <code className="text-eco-neon font-mono text-[11px]">(NIR - Red) / (NIR + Red)</code>.
            Here is the step-by-step scientific breakdown of why NDVI drops during <strong>Continuous Rain (Ola Dushkal)</strong> versus <strong>Dry Spell (Suka Dushkal)</strong>:
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {/* Scenario A */}
            <div className="rounded-xl bg-black/50 border border-cyan-500/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300 border-b border-cyan-500/20 pb-2">
                <span className="flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-cyan-400" />
                  केस १: सतत पाऊस पडल्यास (Continuous Heavy Rain)
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px]">ओला दुष्काळ</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">दिवस १-३:</span>
                  <span className="text-zinc-300">काळी माती जलसंपृक्त होते (Saturation reaches 100%).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">दिवस ४-१०:</span>
                  <span className="text-zinc-300">शेतात पाणी साचून राहते; मुळांना ऑक्सिजन मिळणे बंद होते (Anaerobic root zone).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-cyan-400 shrink-0 font-bold">दिवस ११+:</span>
                  <span className="text-zinc-300">मुळे कुजतात (Root rot), पाने पिवळी पडून पिके आडवी होतात (Lodging).</span>
                </div>
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-[11px]">
                  <strong>🛰️ NDVI परिणाम:</strong> साचलेले पाणी NIR शोषून घेते व पाने कुजतात. पाऊस भरपूर असूनही <strong>NDVI ०.५५ वरून थेट ०.३० पर्यंत खाली कोसळतो!</strong>
                </div>
              </div>
            </div>

            {/* Scenario B */}
            <div className="rounded-xl bg-black/50 border border-amber-500/30 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300 border-b border-amber-500/20 pb-2">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  केस २: पावसाचा खंड पडल्यास (Prolonged Rain Hiatus)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">सुका दुष्काळ</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">आठवडा १-२:</span>
                  <span className="text-zinc-300">वरच्या थरातील ओलावा संपतो; जमिनीला भेगा पडतात.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">आठवडा ३-४:</span>
                  <span className="text-zinc-300">मुळांचे केशिका आकर्षण तुटते; पाने कोमेजून सुरकुततात (Wilting).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">आठवडा ५+:</span>
                  <span className="text-zinc-300">हरितद्रव्य (Chlorophyll) नष्ट होऊन पाने वाळतात.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px]">
                  <strong>🛰️ NDVI परिणाम:</strong> वनस्पतींमधील पाण्याचे प्रमाण घटल्याने दर आठवड्याला <strong>NDVI सातत्याने घसरतो (उदा. ०.४८ → ०.४० → ०.३२).</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
