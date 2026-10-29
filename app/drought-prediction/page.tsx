'use client';

import React from 'react';
import { DroughtPredictionDashboard } from '@/components/drought/DroughtPredictionDashboard';
import {
  Activity,
  Brain,
  Layers,
  Shield,
  Eye,
  Cpu,
} from 'lucide-react';

export default function DroughtPredictionPage() {
  return (
    <main className="min-h-screen bg-[#070C08]">
      {/* Page Header */}
      <div className="border-b border-white/[0.06] bg-[#0D1B0F]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-eco-900/50 border border-eco-700/40 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-eco-neon" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display text-white tracking-tight">
                    Drought Prediction Module
                  </h1>
                  <p className="text-xs text-zinc-400 font-mono">
                    Rule-Based Scoring Engine · v1.0.0
                  </p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Transparent, explainable drought risk forecasting using a weighted multi-factor scoring system.
                Combines NDVI, VCI, rainfall deficit, temperature anomaly, and trend analysis with hard-rule
                overrides for critical conditions.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Layers, label: '5-Factor Model' },
                { icon: Shield, label: 'Hard-Rule Overrides' },
                { icon: Eye, label: 'Explainable AI' },
                { icon: Cpu, label: 'ML-Ready' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] text-[11px] font-mono text-zinc-400"
                >
                  <Icon className="w-3.5 h-3.5 text-eco-neon" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                step: '01',
                title: 'Input Features',
                desc: 'NDVI, VCI, rainfall, temperature anomaly, and multi-week slope trends',
              },
              {
                step: '02',
                title: 'Component Scoring',
                desc: '5 weighted factors scored 0–100 each: VCI (30%), Rainfall (25%), NDVI trend (20%), NDVI health (15%), Temp (10%)',
              },
              {
                step: '03',
                title: 'Hard-Rule Overrides',
                desc: 'Deterministic safety rules upgrade classification for critical VCI + rainfall or persistent NDVI decline',
              },
              {
                step: '04',
                title: 'Risk Forecast',
                desc: 'Score 0–100, drought class, confidence level, primary driver, and recommended action',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-white/[0.06] bg-[#0D1B0F]/40 p-4 space-y-1.5"
              >
                <span className="text-eco-neon text-[11px] font-mono font-bold">{item.step}</span>
                <p className="text-white text-sm font-semibold">{item.title}</p>
                <p className="text-zinc-500 text-[11px] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DroughtPredictionDashboard />
      </div>
    </main>
  );
}
