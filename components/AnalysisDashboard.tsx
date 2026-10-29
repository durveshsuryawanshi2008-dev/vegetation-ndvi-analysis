'use client';

import React, { useState, useRef } from 'react';
import { NdviAnalysisResponse } from '@/lib/types';
import { MetricsGrid } from './MetricsGrid';
import { DroughtPredictor } from './DroughtPredictor';
import { DroughtDropAlert } from './DroughtDropAlert';
import { MonthlyComparisonVerdict } from './MonthlyComparisonVerdict';
import { ClimateDisasterPredictor } from './ClimateDisasterPredictor';
import { NdviChart } from './NdviChart';
import { YearlyTable } from './YearlyTable';
import { VegetationInterpretation } from './VegetationInterpretation';
import { LatestObservationCard } from './LatestObservationCard';
import { PeriodComparisonsPanel } from './PeriodComparisonsPanel';
import { MultiHazardMonitor } from './hazards/MultiHazardMonitor';
import { HistoricalEventExplorer } from './hazards/HistoricalEventExplorer';
import { SatelliteSwipeExplorer } from './explorer/SatelliteSwipeExplorer';
import { AiInsightsPanel } from './intelligence/AiInsightsPanel';
import {
  RotateCw,
  Database,
  CheckCircle2,
  Printer,
  Download,
  LayoutDashboard,
  Brain,
  ShieldAlert,
  Satellite,
  History,
} from 'lucide-react';

interface AnalysisDashboardProps {
  data: NdviAnalysisResponse;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastCheckedAt?: string | null;
  isCheckingUpdates?: boolean;
  isPollingPaused?: boolean;
}

type DashboardTab = 'overview' | 'insights' | 'hazards' | 'satellite' | 'history';

export function AnalysisDashboard({
  data,
  onRefresh,
  isRefreshing,
  lastCheckedAt,
  isCheckingUpdates,
  isPollingPaused,
}: AnalysisDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [chartGranularity, setChartGranularity] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  const chartSectionRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDrilldown = (target: 'monthly' | 'weekly' = 'monthly') => {
    setActiveTab('overview');
    setChartGranularity(target);
    setTimeout(() => {
      if (chartSectionRef.current) {
        chartSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleExportCsv = () => {
    const rows: string[][] = [];

    // Header section
    rows.push(['SATELLITE AGRICULTURAL INTELLIGENCE & MULTI-HAZARD EARLY WARNING REPORT']);
    rows.push(['Generated At', new Date().toISOString()]);
    rows.push(['Area', `"${data.area}"`]);
    rows.push(['State / Region', `"${data.state || 'N/A'}"`]);
    rows.push(['Country', `"${data.country}"`]);
    rows.push(['Total Area (km²)', data.areaKm2.toString()]);
    rows.push(['Data Freshness', data.latestObservation?.dataFreshness || (data.metadata?.persistedToDb ? 'DATABASE_CACHE' : 'LIVE')]);
    rows.push([]);

    // Latest Observation
    if (data.latestObservation) {
      rows.push(['LATEST OBSERVATION TELEMETRY']);
      rows.push(['Observation Date', data.latestObservation.acquisitionDate]);
      rows.push(['Satellite Sensor', data.latestObservation.satelliteSource]);
      rows.push(['Latest NDVI', data.latestObservation.latestNdvi !== null ? data.latestObservation.latestNdvi.toFixed(4) : 'N/A']);
      rows.push(['Cloud Coverage %', data.latestObservation.cloudCoveragePercent.toFixed(1)]);
      rows.push(['Valid Pixel Coverage %', data.latestObservation.validPixelCoveragePercent.toFixed(1)]);
      rows.push(['Prior Observation Date', data.latestObservation.previousObservationDate || 'N/A']);
      rows.push(['Prior Observation NDVI', data.latestObservation.previousObservationValue !== null ? data.latestObservation.previousObservationValue.toFixed(4) : 'N/A']);
      rows.push(['Absolute Change', data.latestObservation.absoluteChange !== null ? data.latestObservation.absoluteChange.toFixed(4) : 'N/A']);
      rows.push(['Percent Change (%)', data.latestObservation.percentChange !== null ? data.latestObservation.percentChange.toFixed(2) : 'N/A']);
      rows.push([]);
    }

    // Drought Risk & Hazard Assessment
    if (data.droughtPrediction) {
      rows.push(['EARLY WARNING & HAZARD STATUS']);
      rows.push(['Drought Risk Probability (0-100%)', data.droughtPrediction.droughtProbability.toString()]);
      rows.push(['Drought Severity Classification', `"${data.droughtPrediction.droughtSeverity}"`]);
      rows.push(['Rainfall Stress Index', `"${data.droughtPrediction.rainfallStressIndex}"`]);
      rows.push(['Current VCI', data.droughtPrediction.vci.toFixed(1)]);
      rows.push(['NDVI Anomaly (%)', data.droughtPrediction.ndviAnomalyPercent.toFixed(1)]);
      rows.push(['Current NDVI', data.droughtPrediction.currentNdvi.toFixed(4)]);
      rows.push(['Historical Baseline NDVI', data.droughtPrediction.historicalBaselineNdvi.toFixed(4)]);
      rows.push(['Scientific Summary', `"${data.droughtPrediction.predictionSummary.replace(/"/g, '""')}"`]);
      if (data.droughtPrediction.agriculturalAdvisories.length > 0) {
        rows.push(['Agricultural Advisories', `"${data.droughtPrediction.agriculturalAdvisories.join(' | ').replace(/"/g, '""')}"`]);
      }
      rows.push([]);
    }

    // Multi-Hazard Status
    if (data.multiHazardStatus) {
      rows.push(['MULTI-HAZARD MONITORING STATUS']);
      rows.push(['Drought Observed Stress', `"${data.multiHazardStatus.drought.observedStressLevel}"`]);
      rows.push(['Drought Estimated Risk Score', data.multiHazardStatus.drought.estimatedRiskScore.toString()]);
      rows.push(['Drought Soil Capillary Status', `"${data.multiHazardStatus.drought.soilCapillaryStatus}"`]);
      rows.push(['Flood Observed Inundation Detected', data.multiHazardStatus.flood.observedInundationDetected ? 'YES' : 'NO']);
      rows.push(['Flood Radar SAR Signal', `"${data.multiHazardStatus.flood.radarSarSignal}"`]);
      rows.push(['Flood Topographic Susceptibility', `"${data.multiHazardStatus.flood.topographicSusceptibility}"`]);
      rows.push(['Flood 3-Day Rainfall (mm)', data.multiHazardStatus.flood.cumulativeRainfall3DayMm.toFixed(1)]);
      rows.push(['Cyclone Active Warning', data.multiHazardStatus.cyclone.activeWarning ? 'ACTIVE' : 'NONE']);
      if (data.multiHazardStatus.cyclone.systemName) {
        rows.push(['Cyclone System Name', `"${data.multiHazardStatus.cyclone.systemName}"`]);
      }
      rows.push(['Rapid Loss Canopy Flag', data.multiHazardStatus.rapidVegetationLoss.unexplainedCanopyLossDetected ? 'FLAGGED' : 'CLEAR']);
      rows.push(['Data Completeness Flag', `"${data.multiHazardStatus.rapidVegetationLoss.qualityFlags.dataCompleteness}"`]);
      rows.push([]);
    }

    // Yearly Summary Table
    rows.push(['ANNUAL HISTORICAL METRICS']);
    rows.push(['Year', 'Mean NDVI', 'Min NDVI', 'Max NDVI', 'Vegetation Status', 'Observation Count']);
    for (const yr of data.years) {
      rows.push([
        yr.year.toString(),
        yr.avgNdvi !== null && yr.avgNdvi !== undefined ? yr.avgNdvi.toFixed(4) : 'N/A',
        yr.minNdvi !== null && yr.minNdvi !== undefined ? yr.minNdvi.toFixed(4) : 'N/A',
        yr.maxNdvi !== null && yr.maxNdvi !== undefined ? yr.maxNdvi.toFixed(4) : 'N/A',
        `"${yr.vegetationStatus}"`,
        yr.imageCount !== undefined ? yr.imageCount.toString() : 'N/A',
      ]);
    }
    rows.push([]);

    // Monthly Time Series
    if (data.monthlyData && data.monthlyData.length > 0) {
      rows.push(['MONTHLY TIME SERIES DATA']);
      rows.push(['Month', 'Label', 'Avg NDVI', 'Min NDVI', 'Max NDVI', 'Vegetation Status']);
      for (const m of data.monthlyData) {
        rows.push([
          `"${m.month}"`,
          `"${m.label}"`,
          m.avgNdvi !== null && m.avgNdvi !== undefined ? m.avgNdvi.toFixed(4) : 'N/A',
          m.minNdvi !== null && m.minNdvi !== undefined ? m.minNdvi.toFixed(4) : 'N/A',
          m.maxNdvi !== null && m.maxNdvi !== undefined ? m.maxNdvi.toFixed(4) : 'N/A',
          `"${m.vegetationStatus}"`,
        ]);
      }
      rows.push([]);
    }

    // Weekly Time Series
    if (data.weeklyData && data.weeklyData.length > 0) {
      rows.push(['WEEKLY TIME SERIES DATA']);
      rows.push(['Period', 'Label', 'Start Date', 'End Date', 'Avg NDVI', 'Vegetation Status']);
      for (const w of data.weeklyData) {
        rows.push([
          `"${w.period}"`,
          `"${w.label}"`,
          `"${w.startDate}"`,
          `"${w.endDate}"`,
          w.avgNdvi !== null && w.avgNdvi !== undefined ? w.avgNdvi.toFixed(4) : 'N/A',
          `"${w.vegetationStatus}"`,
        ]);
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeArea = data.area.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `${safeArea}_satellite_intelligence_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clean state name if it contains numeric codes or is empty
  const rawState = (data.state || '').trim();
  const cleanState =
    rawState && !/^\d+$/.test(rawState) && rawState.toLowerCase() !== data.area.toLowerCase()
      ? rawState
      : '';

  const hazardAlertCount =
    (data.multiHazardStatus?.drought.observedStressLevel === 'High' || data.multiHazardStatus?.drought.observedStressLevel === 'Severe' ? 1 : 0) +
    (data.multiHazardStatus?.flood.observedInundationDetected ? 1 : 0) +
    (data.multiHazardStatus?.cyclone.activeWarning ? 1 : 0);

  return (
    <div className="w-full space-y-7 animate-in fade-in duration-300">
      {/* Dashboard Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel rounded-2xl p-6 border-eco-neon/20 shadow-[0_0_30px_rgba(198,241,53,0.05)]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded-full bg-eco-900 border border-eco-neon/40 text-eco-neon">
              Analysis Results
            </span>
            <span
              className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                data.metadata?.analysisScope === 'CITY_BUFFER_10KM'
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/[0.04] border-white/10 text-zinc-400'
              }`}
            >
              {data.metadata?.analysisScope === 'CITY_BUFFER_10KM'
                ? 'Radial Buffer Fallback (10 km)'
                : 'Authoritative Administrative Boundary'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            <span>{data.area}</span>
            <span className="text-zinc-500 font-normal text-lg sm:text-xl">
              &bull; {cleanState ? `${cleanState}, ` : ''}{data.country}
            </span>
          </h2>

          <p className="text-xs text-zinc-400 font-mono">
            {data.metadata?.scopeDescription ||
              `Analyzed across ${data.areaKm2.toLocaleString()} km² using Sentinel-2 L2A surface reflectance composites (2021–2025)`}
          </p>
        </div>

        {/* Action Buttons: Refresh, CSV, PDF */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-mono text-xs transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-eco-neon' : ''}`} />
            <span>{isRefreshing ? 'Recalculating...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-eco-950/40 hover:bg-eco-900/60 border border-eco-500/40 text-eco-neon font-mono text-xs transition-all"
            title="Download full dataset as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white font-mono text-xs transition-all"
            title="Print or save as PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Database Persistence Status Badge */}
      {data.metadata?.persistedToDb ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            Analysis verified and persisted in cloud database cache.
          </span>
        </div>
      ) : data.metadata?.dbMessage ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono">
          <Database className="w-4 h-4 shrink-0 text-zinc-500" />
          <span>
            Database notice: {data.metadata.dbMessage}.
          </span>
        </div>
      ) : null}

      {/* Master Navigation Tab Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
            activeTab === 'overview'
              ? 'bg-eco-neon text-black font-bold shadow-[0_0_15px_rgba(198,241,53,0.3)]'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Overview &amp; Drilldowns</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
            activeTab === 'insights'
              ? 'bg-eco-neon text-black font-bold shadow-[0_0_15px_rgba(198,241,53,0.3)]'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>AI Insights</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'insights' ? 'bg-black/20 text-black font-black' : 'bg-eco-900/60 text-eco-neon'}`}>
            v2.4
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hazards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
            activeTab === 'hazards'
              ? 'bg-eco-neon text-black font-bold shadow-[0_0_15px_rgba(198,241,53,0.3)]'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Multi-Hazard Matrix</span>
          {hazardAlertCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${activeTab === 'hazards' ? 'bg-amber-900 text-amber-200' : 'bg-amber-500/20 text-amber-300'}`}>
              {hazardAlertCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('satellite')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
            activeTab === 'satellite'
              ? 'bg-eco-neon text-black font-bold shadow-[0_0_15px_rgba(198,241,53,0.3)]'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite Explorer</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'satellite' ? 'bg-black/20 text-black font-black' : 'bg-cyan-950/60 text-cyan-400'}`}>
            Swipe
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
            activeTab === 'history'
              ? 'bg-eco-neon text-black font-bold shadow-[0_0_15px_rgba(198,241,53,0.3)]'
              : 'bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:text-white border border-white/10'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historical Registry</span>
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${activeTab === 'history' ? 'bg-black/20 text-black font-black' : 'bg-purple-950/60 text-purple-300'}`}>
            5 Events
          </span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & DRILLDOWNS ── */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Latest Observation Telemetry Card */}
          <LatestObservationCard
            latestObservation={data.latestObservation}
            cropSeasonContext={data.cropSeasonContext}
            areaName={data.area}
            lastCheckedAt={lastCheckedAt}
            isCheckingUpdates={isCheckingUpdates}
            isPollingPaused={isPollingPaused}
            onManualRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />

          {/* CRITICAL NOTIFICATION: Vegetation Drop Alert with Historical Precedent */}
          <DroughtDropAlert
            data={data}
            onDrilldownToMonths={() => handleDrilldown('monthly')}
          />

          {/* LIVE MONTH-OVER-MONTH COMPARISON VERDICT: OK vs DROUGHT DETECTED */}
          <MonthlyComparisonVerdict
            monthlyData={data.monthlyData}
            weeklyData={data.weeklyData}
            areaName={data.area}
            cropSeasonContext={data.cropSeasonContext}
            droughtPrediction={data.droughtPrediction}
            onViewMonthlyChart={() => handleDrilldown('monthly')}
            onViewWeeklyChart={() => handleDrilldown('weekly')}
          />

          {/* Multi-Period Comparisons & Interactive Slider Simulator */}
          <PeriodComparisonsPanel
            comparisons={data.periodComparisons}
            cropSeasonContext={data.cropSeasonContext}
            areaName={data.area}
          />

          {/* 1. Metrics Grid (Territory, Area Extent, Latest NDVI, Status) */}
          <MetricsGrid data={data} />

          {/* 2. Live Climate Disaster & Drought Early Warning Engine: Wet vs. Dry Events */}
          <ClimateDisasterPredictor
            prediction={data.droughtPrediction}
            areaName={data.area}
            state={cleanState}
            onDrilldownWeekly={() => handleDrilldown('weekly')}
          />

          {/* 3. Live Drought Early Warning & Prediction System */}
          {data.droughtPrediction && (
            <DroughtPredictor
              droughtPrediction={data.droughtPrediction}
              areaName={data.area}
              state={cleanState}
              country={data.country}
            />
          )}

          {/* 4. Multi-Temporal Line & Bar Graph (Touch to Drilldown Year -> Month -> Week) */}
          <div ref={chartSectionRef} className="scroll-mt-6">
            <NdviChart
              years={data.years}
              monthlyData={data.monthlyData}
              weeklyData={data.weeklyData}
              areaName={data.area}
              externalGranularity={chartGranularity}
              onGranularityChange={setChartGranularity}
            />
          </div>

          {/* 5. Year-Wise Data Table with Touch Drilldown to Months */}
          <YearlyTable
            years={data.years}
            onSelectYear={(year) => handleDrilldown('monthly')}
          />

          {/* 6. Scientific Interpretation and Ecological Threshold Guide */}
          <VegetationInterpretation />
        </div>
      )}

      {/* ── TAB 2: AI INSIGHTS & 4-TIER MODEL ── */}
      {activeTab === 'insights' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <AiInsightsPanel data={data} />

          <PeriodComparisonsPanel
            comparisons={data.periodComparisons}
            cropSeasonContext={data.cropSeasonContext}
            areaName={data.area}
          />

          <VegetationInterpretation />
        </div>
      )}

      {/* ── TAB 3: MULTI-HAZARD MATRIX ── */}
      {activeTab === 'hazards' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <MultiHazardMonitor
            multiHazardStatus={data.multiHazardStatus}
            areaName={data.area}
          />

          <ClimateDisasterPredictor
            prediction={data.droughtPrediction}
            areaName={data.area}
            state={cleanState}
            onDrilldownWeekly={() => handleDrilldown('weekly')}
          />

          <DroughtDropAlert
            data={data}
            onDrilldownToMonths={() => handleDrilldown('monthly')}
          />
        </div>
      )}

      {/* ── TAB 4: SATELLITE EXPLORER (BEFORE / AFTER SWIPE) ── */}
      {activeTab === 'satellite' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <SatelliteSwipeExplorer />

          <LatestObservationCard
            latestObservation={data.latestObservation}
            cropSeasonContext={data.cropSeasonContext}
            areaName={data.area}
            lastCheckedAt={lastCheckedAt}
            isCheckingUpdates={isCheckingUpdates}
            isPollingPaused={isPollingPaused}
            onManualRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      )}

      {/* ── TAB 5: HISTORICAL DISASTER REGISTRY ── */}
      {activeTab === 'history' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <HistoricalEventExplorer />
        </div>
      )}
    </div>
  );
}
