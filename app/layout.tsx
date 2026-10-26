import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'NDVI Analyzer | Global Satellite Earth Observation & Vegetation Intelligence',
  description:
    'Multi-temporal vegetation health analysis and NDVI calculation for cities worldwide using Google Earth Engine Sentinel-2 SR Harmonized imagery and TiDB Cloud.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#070C08] text-zinc-100 antialiased selection:bg-eco-neon/30 selection:text-white">
        {/* Subtle grid and ambient radial gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_-10%,rgba(198,241,53,0.07),transparent),radial-gradient(800px_600px_at_90%_20%,rgba(16,185,129,0.05),transparent)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-60" />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
