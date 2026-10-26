'use client';

import React, { useEffect, useState } from 'react';
import { Satellite, Cpu, Radio, Database, Check } from 'lucide-react';

export function LoadingSkeleton({ areaName }: { areaName: string }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Authenticating with Google Earth Engine Private Key...',
    `Resolving boundary and spatial geometry for "${areaName}"...`,
    'Acquiring Copernicus Sentinel-2 Level-2A (SR) image collection...',
    'Filtering cloud cover (< 30%) and applying SCL scene classification masking...',
    'Generating 5-year median composites (2021, 2022, 2023, 2024, 2025)...',
    'Executing spatial reducers: (B8 - B4) / (B8 + B4) mean, min, max...',
    'Computing biophysical classification and updating database cache...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Progress Telemetry Banner */}
      <div className="rounded-2xl border border-eco-neon/30 bg-eco-950/40 p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-eco-900 border border-eco-neon/50 flex items-center justify-center text-eco-neon">
                <Satellite className="w-6 h-6 animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eco-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-eco-neon"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-base">
                  Acquiring Real Satellite Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-eco-neon/20 text-eco-neon border border-eco-neon/30">
                  GEE RUNNING
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Multi-temporal processing for {areaName} across 5 calendar years
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Radio className="w-4 h-4 text-eco-neon animate-pulse" />
            <span>Processing Step {stepIndex + 1} / {steps.length}</span>
          </div>
        </div>

        {/* Live Step Tracker */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="text-xs font-mono text-eco-neon flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-eco-neon animate-ping" />
            <span>{steps[stepIndex]}</span>
          </div>

          {/* Stepper track */}
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-eco-neon h-full transition-all duration-500 rounded-full"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-panel rounded-2xl p-5 space-y-3 animate-pulse"
          >
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="h-7 w-32 bg-white/15 rounded" />
            <div className="h-3 w-28 bg-white/5 rounded pt-1" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 animate-pulse">
        <div className="flex justify-between items-center pb-4 border-b border-white/5">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-white/15 rounded" />
            <div className="h-3 w-64 bg-white/10 rounded" />
          </div>
          <div className="h-4 w-32 bg-white/10 rounded" />
        </div>
        <div className="h-[320px] w-full bg-white/[0.03] rounded-xl flex items-center justify-center">
          <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-600 animate-spin" />
            <span>Computing 5-Year Spatial Reductions...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
