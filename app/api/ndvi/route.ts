import { NextRequest, NextResponse } from 'next/server';
import { analyzeAreaNdvi } from '@/lib/ndvi';
import { isEarthEngineConfigured } from '@/lib/earthengine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow sufficient time for satellite processing

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Earth Engine credentials exist
    if (!isEarthEngineConfigured()) {
      return NextResponse.json(
        {
          error:
            'Google Earth Engine credentials are not configured. Please add EARTH_ENGINE_PROJECT_ID, EARTH_ENGINE_CLIENT_EMAIL, and EARTH_ENGINE_PRIVATE_KEY to your .env.local file.',
          code: 'GEE_NOT_CONFIGURED',
          suggestion: 'Refer to .env.local.example and project documentation for credential setup.',
        },
        { status: 503 }
      );
    }

    // 2. Parse request payload
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid JSON payload. Please send {"area": "DistrictName"}.',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    const area = body?.area;
    if (!area || typeof area !== 'string' || area.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Please provide an area name. Example: "Pune"',
          code: 'MISSING_AREA',
        },
        { status: 400 }
      );
    }

    // 3. Execute Earth Engine analysis
    const result = await analyzeAreaNdvi(area.trim());

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const errorMessage = error?.message || 'An unexpected error occurred during satellite NDVI analysis.';
    console.error('API /api/ndvi error:', error);

    // Prompt requirement: "If area is not found, return: Area not found. Try a district name such as Pune."
    if (errorMessage.includes('Area not found') || errorMessage.includes('boundary not found')) {
      return NextResponse.json(
        {
          error: 'Area not found. Try a district name such as Pune.',
          code: 'AREA_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Prompt requirement: "If Earth Engine fails, return a useful server error."
    if (
      errorMessage.includes('Earth Engine') ||
      errorMessage.includes('authenticateViaPrivateKey') ||
      errorMessage.includes('Credentials') ||
      errorMessage.includes('JWT')
    ) {
      return NextResponse.json(
        {
          error: `Google Earth Engine API Error: ${errorMessage}`,
          code: 'GEE_API_ERROR',
          details: 'Verify service account permissions and Earth Engine project registration in Google Cloud Console.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
