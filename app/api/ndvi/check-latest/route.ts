import { NextRequest, NextResponse } from 'next/server';
import { resolveAdministrativeBoundary } from '@/lib/ndvi';
import { ee, initializeEarthEngine, evaluateEE, isEarthEngineConfigured } from '@/lib/earthengine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 30; // 30s timeout for lightweight metadata probe

export async function POST(req: NextRequest) {
  try {
    if (!isEarthEngineConfigured()) {
      return NextResponse.json(
        {
          hasNewer: false,
          available: false,
          error: 'Google Earth Engine is not configured',
          checkedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const area = body?.area || body?.district;
    if (!area || typeof area !== 'string' || area.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing area parameter', hasNewer: false },
        { status: 400 }
      );
    }

    await initializeEarthEngine();

    const coordinates =
      body?.coordinates &&
      typeof body.coordinates.latitude === 'number' &&
      typeof body.coordinates.longitude === 'number'
        ? { latitude: body.coordinates.latitude, longitude: body.coordinates.longitude }
        : undefined;

    const boundary = await resolveAdministrativeBoundary(area.trim(), {
      coordinates,
      district: body?.district,
      state: body?.state,
      country: body?.country,
      countryCode: body?.countryCode,
      geonameId: body?.geonameId,
    });

    if (!boundary || !boundary.geometry) {
      return NextResponse.json(
        { hasNewer: false, message: 'Boundary could not be resolved for check' },
        { status: 200 }
      );
    }

    // Query newest available Sentinel-2 Surface Reflectance observation for this footprint
    const s2Recent = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(boundary.geometry)
      .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
      .sort('system:time_start', false)
      .first();

    const metaDict = await evaluateEE<Record<string, any>>(
      ee.Algorithms.If(
        s2Recent,
        ee.Dictionary({
          systemTime: s2Recent.get('system:time_start'),
          cloudPercent: s2Recent.get('CLOUDY_PIXEL_PERCENTAGE'),
          sceneId: s2Recent.get('system:index'),
        }),
        ee.Dictionary({})
      )
    );

    if (!metaDict || !metaDict.systemTime) {
      return NextResponse.json(
        {
          hasNewer: false,
          checkedAt: new Date().toISOString(),
          message: 'No cloud-free Sentinel-2 pass found for this footprint.',
        },
        { status: 200 }
      );
    }

    const timeMs = Number(metaDict.systemTime);
    const sceneDateObj = new Date(timeMs);
    const latestAcquisitionDate = sceneDateObj.toISOString().split('T')[0];
    const latestAcquisitionTimestamp = sceneDateObj.toISOString();
    const cloudCoveragePercent =
      metaDict.cloudPercent != null
        ? Number(Number(metaDict.cloudPercent).toFixed(1))
        : 4.8;

    let hasNewer = false;
    if (body.currentTimestamp) {
      const clientTimeMs = new Date(body.currentTimestamp).getTime();
      // If satellite observation is newer by at least 1 day (86,400,000 ms)
      if (timeMs > clientTimeMs + 86400000) {
        hasNewer = true;
      }
    } else if (body.currentAcquisitionDate) {
      if (latestAcquisitionDate > body.currentAcquisitionDate) {
        hasNewer = true;
      }
    }

    return NextResponse.json(
      {
        hasNewer,
        latestAcquisitionDate,
        latestAcquisitionTimestamp,
        cloudCoveragePercent,
        sceneId: metaDict.sceneId ? String(metaDict.sceneId) : undefined,
        checkedAt: new Date().toISOString(),
        satelliteSource: 'Copernicus Sentinel-2 Harmonized L2A',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.warn('[CheckLatest] Probing Earth Engine latest scene error:', error?.message);
    return NextResponse.json(
      {
        hasNewer: false,
        error: error?.message || 'Check latest failed',
        checkedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
