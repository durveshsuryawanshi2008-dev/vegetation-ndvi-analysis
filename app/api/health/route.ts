import { NextResponse } from 'next/server';
import { getEarthEngineStatus } from '@/lib/earthengine';
import { getDatabaseStatus } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [eeStatus, dbStatus] = await Promise.all([
    getEarthEngineStatus(),
    getDatabaseStatus(),
  ]);

  return NextResponse.json({
    status: eeStatus.authenticated && dbStatus.connected ? 'healthy' : 'configuration_required',
    earthEngine: eeStatus,
    database: dbStatus,
    calendarYears: [2021, 2022, 2023, 2024, 2025],
    timestamp: new Date().toISOString(),
  });
}
