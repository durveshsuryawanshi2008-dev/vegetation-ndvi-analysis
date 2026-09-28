'use client';

import React, { useEffect, useState } from 'react';
import { DbReport } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  FileText,
  Search,
  Database,
  Calendar,
  Layers,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  RefreshCw,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const [reports, setReports] = useState<DbReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      } else {
        setError(data.error || 'Failed to retrieve reports from SQL database.');
      }
    } catch (err: any) {
      setError(err?.message || 'Database connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.title?.toLowerCase().includes(term) ||
      r.area_name?.toLowerCase().includes(term) ||
      r.country?.toLowerCase().includes(term) ||
      r.state?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 text-xs font-mono">
            <Database className="w-3.5 h-3.5" />
            <span>TiDB CLOUD / MySQL RELATIONAL REPOSITORY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Vegetation Intelligence Reports
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono">
            Historical audit logs and synthesized 5-year NDVI reports persisted in the DBMS
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReports}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 font-mono text-xs transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-eco-neon' : ''}`} />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by district name or country..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-panel text-white placeholder-zinc-500 text-xs sm:text-sm font-mono focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-eco-neon mx-auto" />
          <p className="text-xs font-mono text-zinc-400">Loading historical reports from database...</p>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 border-amber-500/30">
          <Database className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="font-display font-bold text-white text-base">Database Configuration Notice</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {error}. To store and retrieve multi-temporal analysis requests, ensure <code className="text-zinc-200">DATABASE_URL</code> is defined in your <code className="text-zinc-200">.env.local</code>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-eco-neon text-black font-semibold text-xs font-mono"
          >
            <span>Run First Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="font-display font-bold text-white text-base">No Reports Stored Yet</h3>
          <p className="text-xs text-zinc-400">
            {searchTerm
              ? `No saved analyses matched "${searchTerm}".`
              : 'Execute an NDVI analysis on the home page to automatically persist records to the SQL database.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-eco-neon text-black font-semibold text-xs font-mono shadow-[0_0_15px_rgba(198,241,53,0.3)]"
          >
            <span>Go to Analysis Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="glass-panel rounded-2xl p-5 space-y-4 hover:border-eco-neon/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <StatusBadge status={report.overall_status} size="sm" />
                  <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-white text-lg tracking-tight">
                    {report.area_name || report.title}
                  </h3>
                  <div className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-eco-neon" />
                    <span>
                      {report.state ? `${report.state}, ` : ''}{report.country || 'Global'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                  {report.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-500">5-Yr Trajectory:</span>
                  {report.change_rate_5yr !== null && report.change_rate_5yr !== undefined ? (
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        report.change_rate_5yr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {report.change_rate_5yr >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {report.change_rate_5yr > 0 ? `+${report.change_rate_5yr}%` : `${report.change_rate_5yr}%`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-500">Baseline</span>
                  )}
                </div>

                {report.area_km2 && (
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                    <span>Boundary Extent:</span>
                    <span className="text-zinc-300">{Number(report.area_km2).toLocaleString()} km²</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
