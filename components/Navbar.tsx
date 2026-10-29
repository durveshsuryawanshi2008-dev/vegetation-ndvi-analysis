'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Satellite, Database, Activity, ShieldCheck, AlertCircle } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<{
    geeConfigured: boolean;
    dbConfigured: boolean;
    loaded: boolean;
  }>({
    geeConfigured: false,
    dbConfigured: false,
    loaded: false,
  });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth({
          geeConfigured: Boolean(data?.earthEngine?.configured),
          dbConfigured: Boolean(data?.database?.configured),
          loaded: true,
        });
      })
      .catch(() => {
        setHealth((prev) => ({ ...prev, loaded: true }));
      });
  }, []);

  const navLinks = [
    { name: 'Analysis', href: '/' },
    { name: 'Drought Monitor', href: '/drought' },
    { name: 'Drought Prediction', href: '/drought-prediction' },
    { name: 'Reports', href: '/reports' },
    { name: 'Methodology', href: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] backdrop-blur-xl bg-[#070C08]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-eco-900 border border-eco-700 flex items-center justify-center text-eco-neon group-hover:border-eco-neon transition-all shadow-[0_0_15px_rgba(198,241,53,0.15)]">
              <Satellite className="w-5 h-5 text-eco-neon" />
            </div>
            <div>
              <div className="font-display font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                <span>NDVI ANALYZER</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-eco-800/80 border border-eco-700 text-eco-neon">
                  GEE S2-SR
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono hidden sm:block">
                Global Satellite Earth Observation
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-eco-neon/15 text-eco-neon border border-eco-neon/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* System telemetry badges */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Earth Engine Status Badge */}
          <div
            title={
              health.loaded
                ? health.geeConfigured
                  ? 'Google Earth Engine credentials configured'
                  : 'GEE credentials missing in .env.local'
                : 'Checking GEE status...'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
              health.loaded && health.geeConfigured
                ? 'bg-eco-900/90 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-900 border-amber-500/30 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health.loaded && health.geeConfigured
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span>
              {health.loaded
                ? health.geeConfigured
                  ? 'GEE ONLINE'
                  : 'GEE CONFIG REQUIRED'
                : 'GEE CHECK...'}
            </span>
          </div>

          {/* Database Status Badge */}
          <div
            title={
              health.loaded
                ? health.dbConfigured
                  ? 'TiDB / MySQL Database configured'
                  : 'DATABASE_URL missing in .env.local'
                : 'Checking DB status...'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
              health.loaded && health.dbConfigured
                ? 'bg-eco-900/90 border-eco-neon/40 text-eco-neon'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
            }`}
          >
            <Database className="w-3 h-3" />
            <span>
              {health.loaded
                ? health.dbConfigured
                  ? 'TiDB CONNECTED'
                  : 'DB OFFLINE'
                : 'DB...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
