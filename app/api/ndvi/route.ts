import { NextRequest, NextResponse } from 'next/server';
import { analyzeAreaNdvi } from '@/lib/ndvi';
import { isEarthEngineConfigured } from '@/lib/earthengine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 60; // 60 seconds satellite processing time window

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

    const area = body?.area || body?.district;
    if (!area || typeof area !== 'string' || area.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Please provide an area or city name. Example: "Pune", "Bengaluru", or "Tokyo"',
          code: 'MISSING_AREA',
        },
        { status: 400 }
      );
    }

    // Extract coordinates if provided
    let coordinates: { latitude: number; longitude: number } | undefined = undefined;
    if (
      body.coordinates &&
      typeof body.coordinates.latitude === 'number' &&
      typeof body.coordinates.longitude === 'number' &&
      !Number.isNaN(body.coordinates.latitude) &&
      !Number.isNaN(body.coordinates.longitude)
    ) {
      coordinates = {
        latitude: body.coordinates.latitude,
        longitude: body.coordinates.longitude,
      };
    } else if (
      typeof body.latitude === 'number' &&
      typeof body.longitude === 'number' &&
      !Number.isNaN(body.latitude) &&
      !Number.isNaN(body.longitude)
    ) {
      coordinates = {
        latitude: body.latitude,
        longitude: body.longitude,
      };
    }

    // 3. Execute Earth Engine analysis
    const result = await analyzeAreaNdvi(area.trim(), {
      geonameId: typeof body?.geonameId === 'number' ? body.geonameId : undefined,
      coordinates,
      district: typeof body?.district === 'string' ? body.district.trim() : undefined,
      state: typeof body?.state === 'string' ? body.state.trim() : undefined,
      country: typeof body?.country === 'string' ? body.country.trim() : undefined,
      countryCode: typeof body?.countryCode === 'string' ? body.countryCode.trim() : undefined,
      analysisScope: body?.analysisScope,
      forceLive: body?.forceLive !== undefined ? Boolean(body.forceLive) : true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const errorMessage = error?.message || 'An unexpected error occurred during satellite NDVI analysis.';
    console.error('API /api/ndvi error:', error);

    // If network / DNS resolution fails (e.g. offline, Wi-Fi disconnected, DNS dropped)
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          error: 'Network connectivity error: Could not reach Google Earth Engine or TiDB Cloud (ENOTFOUND). Please check your internet connection or restart the dev server.',
          code: 'NETWORK_DNS_ERROR',
          details: errorMessage,
        },
        { status: 503 }
      );
    }

    // If area boundary is not found
    if (errorMessage.includes('Area not found') || errorMessage.includes('boundary not found')) {
      return NextResponse.json(
        {
          error: 'Area not found. Try a district or city name such as Pune, Bengaluru, or Tokyo.',
          code: 'AREA_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // If Earth Engine authentication or API fails
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
