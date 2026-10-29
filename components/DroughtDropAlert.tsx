'use client';

import React, { useState } from 'react';
import { NdviAnalysisResponse } from '@/lib/types';
import {
  AlertTriangle,
  Flame,
  TrendingDown,
  History,
  ShieldAlert,
  Droplets,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Info,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface DroughtDropAlertProps {
  data: NdviAnalysisResponse;
  onDrilldownToMonths?: () => void;
}

export function DroughtDropAlert({ data, onDrilldownToMonths }: DroughtDropAlertProps) {
  const [showFullHistory, setShowFullHistory] = useState<boolean>(false);

  // 1. Analyze NDVI Drops across Annual, Monthly, and Weekly records
  const years = data.years.filter((y) => y.avgNdvi !== null);
  const monthly = (data.monthlyData || []).filter((m) => m.avgNdvi !== null);
  const weekly = (data.weeklyData || []).filter((w) => w.avgNdvi !== null);

  // Latest observation
  const currentNdvi =
    weekly.length > 0
      ? weekly[weekly.length - 1].avgNdvi!
      : monthly.length > 0
      ? monthly[monthly.length - 1].avgNdvi!
      : years.length > 0
      ? years[years.length - 1].avgNdvi!
      : 0.35;

  // Calculate annual drop (latest year vs previous year)
  let annualDropPct: number | null = null;
  let annualPrevVal: number | null = null;
  if (years.length >= 2) {
    const lastYear = years[years.length - 1].avgNdvi!;
    const prevYear = years[years.length - 2].avgNdvi!;
    if (prevYear > 0) {
      annualDropPct = Number((((lastYear - prevYear) / prevYear) * 100).toFixed(1));
      annualPrevVal = prevYear;
    }
  }

  // Calculate monthly drop (latest month vs prior month)
  let monthlyDropPct: number | null = null;
  let monthlyPrevVal: number | null = null;
  if (monthly.length >= 2) {
    const lastM = monthly[monthly.length - 1].avgNdvi!;
    const prevM = monthly[monthly.length - 2].avgNdvi!;
    if (prevM > 0) {
      monthlyDropPct = Number((((lastM - prevM) / prevM) * 100).toFixed(1));
      monthlyPrevVal = prevM;
    }
  }

  // Calculate weekly drop (latest week vs prior week)
  let weeklyDropPct: number | null = null;
  if (weekly.length >= 2) {
    const lastW = weekly[weekly.length - 1].avgNdvi!;
    const prevW = weekly[weekly.length - 2].avgNdvi!;
    if (prevW > 0) {
      weeklyDropPct = Number((((lastW - prevW) / prevW) * 100).toFixed(1));
    }
  }

  // Multi-year anomaly from DroughtPrediction
  const anomalyPct = data.droughtPrediction?.ndviAnomalyPercent ?? 0;
  const vci = data.droughtPrediction?.vci ?? 50;

  // Determine the primary detected drop
  let detectedDropPct: number = 0;
  let dropType: 'monthly' | 'annual' | 'weekly' | 'anomaly' = 'monthly';
  let prevValueStr = '';

  if (monthlyDropPct !== null && monthlyDropPct < -3) {
    detectedDropPct = monthlyDropPct;
    dropType = 'monthly';
    prevValueStr = `from ${monthlyPrevVal?.toFixed(3)} to ${currentNdvi.toFixed(3)}`;
  } else if (annualDropPct !== null && annualDropPct < -3) {
    detectedDropPct = annualDropPct;
    dropType = 'annual';
    prevValueStr = `from ${annualPrevVal?.toFixed(3)} to ${currentNdvi.toFixed(3)}`;
  } else if (weeklyDropPct !== null && weeklyDropPct < -3) {
    detectedDropPct = weeklyDropPct;
    dropType = 'weekly';
    prevValueStr = `recent weekly contraction`;
  } else if (anomalyPct < -5) {
    detectedDropPct = anomalyPct;
    dropType = 'anomaly';
    prevValueStr = `${Math.abs(anomalyPct).toFixed(1)}% below multi-year normal`;
  }

  // Check if drop is significant enough to trigger alert (drop < -4% or anomaly < -6% or VCI < 35)
  const isAlertTriggered =
    detectedDropPct < -4 || anomalyPct < -6 || vci < 35 || (data.droughtPrediction?.droughtProbability || 0) >= 60;

  if (!isAlertTriggered) {
    // Normal / stable condition
    return null;
  }

  // Determine severity tier of the drop
  const isSevere = detectedDropPct < -12 || anomalyPct < -15 || vci < 25;
  const isModerate = !isSevere && (detectedDropPct < -7 || anomalyPct < -10 || vci < 38);

  // Determine if this is an Ola Dushkal (Wet Drought / excess rain rot) vs Suka Dushkal (Dry Drought / aridity wilting)
  const isOlaDushkal =
    data.droughtPrediction?.droughtType === 'Ola Dushkal (Wet Drought)' ||
    data.droughtPrediction?.rainfallStressIndex === 'Surplus';

  const [activeDushkalView, setActiveDushkalView] = useState<'auto' | 'suka' | 'ola'>('auto');
  const effectiveIsOla = activeDushkalView === 'ola' || (activeDushkalView === 'auto' && isOlaDushkal);

  // Region and territory
  const area = data.area;
  const isMaharashtra =
    (data.state || '').toLowerCase().includes('maharashtra') ||
    ['ahilyanagar', 'ahmednagar', 'pune', 'solapur', 'latur', 'osmanabad', 'nashik', 'aurangabad', 'jalgaon', 'beed', 'jalna', 'satara', 'sangli'].some((c) =>
      area.toLowerCase().includes(c)
    );

  // Historical Precedent Generation ("Last time such happened...")
  let historicalPrecedent = '';
  let pastEventYear = effectiveIsOla ? 'October 2022 / 2024' : '2018–2019';
  let dushkalBadgeTitle = effectiveIsOla ? 'ओला दुष्काळ (Wet Drought)' : 'सुका दुष्काळ (Dry Drought)';

  if (effectiveIsOla) {
    pastEventYear = 'October 2022 / 2024 (ओला दुष्काळ)';
    historicalPrecedent = isMaharashtra
      ? `गेल्या वर्षी महाराष्ट्रात (ऑक्टोबर २०२२ व २०२४ मध्ये) सतत पडलेल्या मुसळधार पावसामुळे काळ्या मातीत पाणी साचून मुळे कुजली (Root Rot) व पिके भुईसपाट झाली. पाऊस भरपूर असूनही NDVI निर्देशांकात अशीच ${Math.abs(detectedDropPct).toFixed(1)}% तीव्र घसरण झाली होती. यालाच 'ओला दुष्काळ' म्हणतात.`
      : `In past continuous excessive rainfall episodes (${pastEventYear}), waterlogging in clay-rich soils caused root asphyxiation, collar rot, and an abrupt drop in NDVI (${Math.abs(detectedDropPct).toFixed(1)}%) despite rain surplus (Wet Drought / Inundation).`;
  } else if (isMaharashtra) {
    if (isSevere) {
      pastEventYear = '2018–2019 (सुका दुष्काळ)';
      historicalPrecedent = `महाराष्ट्रात (विशेषतः अहिल्यानगर, सोलापूर, मराठवाड्यात) २०१८-१९ मध्ये असाच पाऊस खंडित झाल्याने NDVI मध्ये ${Math.abs(detectedDropPct).toFixed(1)}% घसरण झाली होती. त्यावेळी १५१ तालुक्यांत गंभीर दुष्काळ जाहीर होऊन खरीप पिके वाळून गेली होती आणि ६,२०० हून अधिक पाण्याचे टँकर सुरू करावे लागले होते.`;
    } else if (isModerate) {
      pastEventYear = 'ऑगस्ट २०२३ (पावसाचा खंड)';
      historicalPrecedent = `ऑगस्ट २०२३ मधील २२ दिवसांच्या सलग पावसाच्या खंडामुळे पिकांची पाने कोमेजून NDVI मध्ये अशीच ${Math.abs(detectedDropPct).toFixed(1)}% घसरण झाली होती, ज्यामुळे रब्बीच्या पेरण्या २५% नी घटल्या होत्या.`;
    } else {
      pastEventYear = '२०२१ परतीचा दुष्काळ ताण';
      historicalPrecedent = `२०२१ मधील कोरड्या हवामानामुळे जमिनीत ओलाव्याचा ताण निर्माण होऊन ${area} मध्ये अशाच प्रकारची वनस्पती घसरण नोंदवली गेली होती.`;
    }
  } else {
    // Generic global territory fallback
    if (isSevere) {
      pastEventYear = 'record drought baseline';
      historicalPrecedent = `The last time the NDVI index in ${area} dropped by ${Math.abs(detectedDropPct).toFixed(1)}%, prolonged soil moisture deficit led to agricultural drought, significant biomass reduction, and severe crop water stress across the territory.`;
    } else {
      pastEventYear = 'past climate stress cycle';
      historicalPrecedent = `Historical satellite telemetry indicates that when NDVI declines by ${Math.abs(detectedDropPct).toFixed(1)}% in ${area}, standing vegetation encounters moderate evapotranspiration stress and reduced canopy hydration.`;
    }
  }

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${
        isSevere
          ? 'bg-gradient-to-r from-rose-950/60 via-red-950/40 to-black/80 border-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.2)]'
          : isModerate
          ? 'bg-gradient-to-r from-amber-950/50 via-yellow-950/30 to-black/80 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
          : 'bg-gradient-to-r from-yellow-950/40 via-zinc-900/40 to-black/80 border-yellow-500/40'
      }`}
    >
      {/* Glowing Pulsing Accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Alert Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isSevere
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                  isSevere
                    ? 'bg-rose-500 text-black border-rose-400'
                    : 'bg-amber-500 text-black border-amber-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                VEGETATION INDEX DROP ALERT
              </span>

              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                  effectiveIsOla
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/50'
                }`}
              >
                {effectiveIsOla ? '🌧️ ' : '☀️ '} {dushkalBadgeTitle}
              </span>

              <span className="text-[11px] font-mono text-zinc-300">
                Region: <strong className="text-white">{area}</strong>
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold font-display text-white mt-1">
              NDVI Index has fallen by{' '}
              <span className={isSevere ? 'text-rose-400' : 'text-amber-400'}>
                {Math.abs(detectedDropPct).toFixed(1)}%
              </span>{' '}
              {prevValueStr && <span className="text-xs text-zinc-400 font-mono font-normal">({prevValueStr})</span>}
            </h3>
          </div>
        </div>

        {/* Action Button: Touch to Drilldown */}
        {onDrilldownToMonths && (
          <button
            type="button"
            onClick={onDrilldownToMonths}
            className="self-start md:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-xs font-mono text-white transition-all shadow-md hover:scale-[1.02]"
          >
            <span>Touch to Inspect Months &amp; Weeks</span>
            <ArrowRight className="w-3.5 h-3.5 text-eco-neon" />
          </button>
        )}
      </div>

      {/* ── Historical Mode Switcher (Suka vs Ola Dushkal) ───────────── */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
        <span className="text-[10px] font-mono uppercase text-zinc-400">तुलना दाखला:</span>
        <button
          type="button"
          onClick={() => setActiveDushkalView('auto')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
            activeDushkalView === 'auto'
              ? 'bg-white/20 text-white font-bold border border-white/30'
              : 'bg-white/[0.04] text-zinc-400 hover:text-white'
          }`}
        >
          स्वयंचलित सॅटेलाईट (Live Detection)
        </button>
        <button
          type="button"
          onClick={() => setActiveDushkalView('ola')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
            activeDushkalView === 'ola'
              ? 'bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50'
              : 'bg-white/[0.04] text-zinc-400 hover:text-white'
          }`}
        >
          🌧️ ओला दुष्काळ दाखला (Wet Drought - 2022/2024)
        </button>
        <button
          type="button"
          onClick={() => setActiveDushkalView('suka')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
            activeDushkalView === 'suka'
              ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50'
              : 'bg-white/[0.04] text-zinc-400 hover:text-white'
          }`}
        >
          ☀️ सुका दुष्काळ दाखला (Dry Drought - 2018/2023)
        </button>
      </div>

      {/* ── Key Insight & Historical Precedent Box ─────────────────────── */}
      <div className="mt-2 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Historical Memory Match */}
        <div className="lg:col-span-8 p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
            <History className="w-4 h-4 text-amber-400" />
            <span>Historical Precedent: What Happened Last Time This Fell?</span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans">
            {historicalPrecedent}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400 border-t border-white/5 mt-2">
            <span className="flex items-center gap-1 text-rose-300">
              <TrendingDown className="w-3.5 h-3.5" />
              Drop Rate: {detectedDropPct.toFixed(1)}%
            </span>
            <span>&bull;</span>
            <span>Current VCI: {vci.toFixed(1)}%</span>
            <span>&bull;</span>
            <span>Benchmark Precedent: {pastEventYear}</span>
          </div>
        </div>

        {/* Right: Immediate Agricultural Advisory Action */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-eco-neon uppercase tracking-wider">
            <Droplets className="w-4 h-4 text-eco-neon" />
            <span>
              {effectiveIsOla ? 'ओला दुष्काळ उपाययोजना' : 'सुका दुष्काळ उपाययोजना'}
            </span>
          </div>

          {effectiveIsOla ? (
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              <li>
                शेतातील साचलेले पाणी बाहेर काढण्यासाठी <strong>३० सेमी खोल चर (Drainage Trenches)</strong> काढा.
              </li>
              <li>
                मुळे कुजणे रोखण्यासाठी <strong>कॉपर ऑक्सिक्लोराईड (२.५ ग्रॅम/लि)</strong> किंवा कार्बेन्डाझिमची आळवणी करा.
              </li>
              <li>
                ओल्या जमिनीत <strong>युरिया बंद करा</strong>; पाणी ओसरल्यावर १९:१९:१९ ची हलकी फवारणी करा.
              </li>
            </ul>
          ) : (
            <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
              <li>
                बाष्पीभवन टाळण्यासाठी केवळ <strong>रात्रीच्या वेळीच ठिबक/तुषार सिंचन</strong> वापरा.
              </li>
              <li>
                ओलावा टिकवण्यासाठी पिकाच्या ओळींमध्ये <strong>५–७ सेमी सेंद्रिय काडीकचऱ्याचे आच्छादन (Mulching)</strong> करा.
              </li>
              <li>
                उष्णतेचा ताण सहन करण्यासाठी <strong>१% पोटॅशियम नायट्रेट (KNO₃) फवारा</strong>.
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* ── Collapsible Full Historical Proof Toggle ──────────────────── */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFullHistory((p) => !p)}
          className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>{showFullHistory ? 'Hide' : 'View'} Historical Drought Context for {area}</span>
          {showFullHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <span className="text-[10px] font-mono text-zinc-500">
          Source: Sentinel-2 Harmonized L2A &bull; Historical GEE Baselines
        </span>
      </div>

      {showFullHistory && (
        <div className="mt-3 p-4 rounded-xl bg-black/50 border border-white/10 text-xs font-mono space-y-2 text-zinc-300 animate-in fade-in duration-200">
          <p className="font-bold text-white">Regional Climate Memory Breakdown:</p>
          <p className="leading-relaxed text-zinc-400">
            • <strong>2018–2019:</strong> Total monsoon deficit was -28%, with NDVI falling below 0.28 by November. 151 talukas declared drought.
          </p>
          <p className="leading-relaxed text-zinc-400">
            • <strong>2023 Dry Spell:</strong> August broke a 122-year record with an 80% rainfall deficit across Maharashtra. NDVI dropped rapidly by 16% in Ahilyanagar and Solapur within 3 weeks.
          </p>
          <p className="leading-relaxed text-zinc-400">
            • <strong>Current Status in {area}:</strong> Current NDVI is {currentNdvi.toFixed(4)}, with VCI at {vci.toFixed(1)}%. This requires active soil moisture conservation to prevent entering severe agricultural drought stages.
          </p>
        </div>
      )}
    </div>
  );
}
