import React from 'react';
import { Database, Satellite, MapPin, Cpu, BookOpen } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050805] text-zinc-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1 */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-white font-display font-bold text-base">
            <Satellite className="w-5 h-5 text-eco-neon" />
            <span>GLOBAL VEGETATION ANALYSIS &amp; NDVI INTELLIGENCE</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
            Enterprise-grade geospatial platform delivering multi-temporal vegetation health analytics from Earth observation satellites. Automated server-side spectral indexing powered by Google Earth Engine.
          </p>
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-500 pt-1">
            <span>Formula: (B8 - B4) / (B8 + B4)</span>
            <span>&bull;</span>
            <span>10m Spatial Resolution</span>
          </div>
        </div>

        {/* Col 2: Architecture */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-mono uppercase tracking-wider text-white">System Architecture</h4>
          <ul className="text-xs space-y-1.5 font-mono text-zinc-400">
            <li className="flex items-center gap-2">
              <Satellite className="w-3.5 h-3.5 text-eco-neon" />
              <span>GEE S2_SR_HARMONIZED</span>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>FAO/GAUL/2025/level2</span>
            </li>
            <li className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>TiDB Cloud Starter (MySQL)</span>
            </li>
            <li className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Next.js 14 App Router</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Navigation */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-mono uppercase tracking-wider text-white">Project Navigation</h4>
          <ul className="text-xs space-y-1.5 text-zinc-400">
            <li>
              <Link href="/" className="hover:text-eco-neon transition-colors">
                Live NDVI Analysis
              </Link>
            </li>
            <li>
              <Link href="/reports" className="hover:text-eco-neon transition-colors">
                Stored DBMS Reports
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-eco-neon transition-colors">
                Platform Architecture &amp; Methodology
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
        <div>&copy; {new Date().getFullYear()} NDVI Analyzer &bull; Earth Observation &amp; Multispectral Analytics</div>
        <div className="flex items-center gap-4">
          <span>COPERNICUS / ESA</span>
          <span>&bull;</span>
          <span>GOOGLE EARTH ENGINE</span>
          <span>&bull;</span>
          <span>TiDB CLOUD</span>
        </div>
      </div>
    </footer>
  );
}
