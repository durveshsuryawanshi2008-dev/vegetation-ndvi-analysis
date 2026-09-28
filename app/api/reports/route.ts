import { NextResponse } from 'next/server';
import { getReports } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reports = await getReports(50);
    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch reports from database',
      },
      { status: 500 }
    );
  }
}
