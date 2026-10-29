import { NextRequest, NextResponse } from 'next/server';
import { resolveAdministrativeBoundary } from '@/lib/ndvi';
import { computeAgriculturalDroughtSystem } from '@/lib/drought-engine';
import { isEarthEngineConfigured } from '@/lib/earthengine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s timeout for multi-spectral Earth Engine reductions

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const area = searchParams.get('area') || 'Ahilyanagar';
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const geonameIdStr = searchParams.get('geonameId');

  return handleDroughtRequest({
    area,
    latitude: latStr ? parseFloat(latStr) : undefined,
    longitude: lonStr ? parseFloat(lonStr) : undefined,
    geonameId: geonameIdStr ? parseInt(geonameIdStr, 10) : undefined,
  });
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const area = body?.area || body?.district || 'Ahilyanagar';
  const latitude = body?.coordinates?.latitude ?? body?.latitude;
  const longitude = body?.coordinates?.longitude ?? body?.longitude;
  const geonameId = body?.geonameId;
  const state = body?.state;
  const country = body?.country;

  return handleDroughtRequest({
    area,
    latitude: typeof latitude === 'number' ? latitude : undefined,
    longitude: typeof longitude === 'number' ? longitude : undefined,
    geonameId: typeof geonameId === 'number' ? geonameId : undefined,
    state,
    country,
  });
}

async function handleDroughtRequest(params: {
  area: string;
  latitude?: number;
  longitude?: number;
  geonameId?: number;
  state?: string;
  country?: string;
}) {
  if (!isEarthEngineConfigured()) {
    return NextResponse.json(
      {
        error:
          'Google Earth Engine credentials are not configured. Please add EARTH_ENGINE_PROJECT_ID, EARTH_ENGINE_CLIENT_EMAIL, and EARTH_ENGINE_PRIVATE_KEY to .env.local.',
        code: 'GEE_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  try {
    const areaName = params.area.trim() || 'Ahilyanagar';

    // 1. Resolve administrative boundary
    const boundary = await resolveAdministrativeBoundary(areaName, {
      geonameId: params.geonameId,
      coordinates:
        params.latitude && params.longitude
          ? { latitude: params.latitude, longitude: params.longitude }
          : undefined,
      state: params.state,
      country: params.country,
    });

    if (!boundary) {
      return NextResponse.json(
        {
          error: `Could not resolve geographic boundaries for "${areaName}". Try a recognized district or city name.`,
          code: 'AREA_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 2. Run Comprehensive Multi-Spectral Drought Engine
    const droughtData = await computeAgriculturalDroughtSystem(
      boundary.geometry,
      boundary.areaKm2,
      boundary.areaName || areaName,
      boundary.state || params.state || 'Maharashtra',
      boundary.country || params.country || 'India'
    );

    // Update with exact resolved boundary coordinates & area
    droughtData.areaKm2 = boundary.areaKm2;
    if (params.latitude && params.longitude) {
      droughtData.coordinates = {
        latitude: params.latitude,
        longitude: params.longitude,
      };
    }

    return NextResponse.json(droughtData, { status: 200 });
  } catch (error: any) {
    console.error('API /api/drought error:', error);
    const errorMessage = error?.message || 'Failed to compute agricultural drought telemetry.';

    return NextResponse.json(
      {
        error: errorMessage,
        code: 'DROUGHT_COMPUTATION_ERROR',
      },
      { status: 500 }
    );
  }
}
