import { NextResponse } from 'next/server';
import { initializeDatabaseSchema, getDatabaseStatus } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const success = await initializeDatabaseSchema();
    const status = await getDatabaseStatus();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'TiDB / MySQL tables (users, areas, analysis_requests, ndvi_results, reports) initialized successfully.',
        status,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to initialize database tables. Ensure DATABASE_URL is valid and accessible.',
          status,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Database initialization exception',
      },
      { status: 500 }
    );
  }
}
