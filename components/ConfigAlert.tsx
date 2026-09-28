import React from 'react';
import { AlertCircle, Key, Database, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface ConfigAlertProps {
  onDismiss?: () => void;
}

export function ConfigAlert({ onDismiss }: ConfigAlertProps) {
  return (
    <div className="relative rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 backdrop-blur-md">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20 shrink-0">
          <Key className="w-5 h-5" />
        </div>
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-amber-300 font-display">
              Google Earth Engine & Database Setup Required
            </h4>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              No Fake Data Policy
            </span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            This application is strictly configured to fetch <strong>real satellite imagery</strong> from{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/40 text-eco-neon font-mono text-xs">
              COPERNICUS/S2_SR_HARMONIZED
            </code>{' '}
            and boundaries from{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/40 text-eco-neon font-mono text-xs">
              FAO/GAUL/2025/level2
            </code>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
              <span className="font-mono text-xs text-white flex items-center gap-1.5 font-semibold">
                <Key className="w-3.5 h-3.5 text-eco-neon" /> 1. Earth Engine Service Account
              </span>
              <p className="text-zinc-400 text-xs">
                Copy <code className="text-zinc-200">.env.local.example</code> to <code className="text-zinc-200">.env.local</code> and provide:
              </p>
              <ul className="list-disc list-inside text-zinc-400 text-[11px] font-mono pl-1">
                <li>EARTH_ENGINE_PROJECT_ID</li>
                <li>EARTH_ENGINE_CLIENT_EMAIL</li>
                <li>EARTH_ENGINE_PRIVATE_KEY</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-1">
              <span className="font-mono text-xs text-white flex items-center gap-1.5 font-semibold">
                <Database className="w-3.5 h-3.5 text-cyan-400" /> 2. TiDB Cloud Starter / MySQL
              </span>
              <p className="text-zinc-400 text-xs">
                Provide your connection string in <code className="text-zinc-200">DATABASE_URL</code> to automatically persist requests, areas, 5-year NDVI time series, and reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 text-xs text-eco-neon hover:underline font-mono"
            >
              <span>Read Full Credentials Setup Guide</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
