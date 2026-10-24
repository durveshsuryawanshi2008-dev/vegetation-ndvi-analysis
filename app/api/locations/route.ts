import { NextRequest, NextResponse } from 'next/server';
import indianCities from '@/lib/data/indian-cities.json';

export const dynamic = 'force-dynamic';

interface LocationResult {
  name: string;
  district: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  osmType?: string;
  osmId?: number | null;
  displayName: string;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const queryLower = query.toLowerCase();

  // 1. Instant local matching for Indian cities
  const localMatches: LocationResult[] = (indianCities as any[])
    .filter(
      (c) =>
        c.name.toLowerCase().includes(queryLower) ||
        c.district.toLowerCase().includes(queryLower) ||
        (c.state && c.state.toLowerCase().includes(queryLower))
    )
    .slice(0, 6)
    .map((c) => ({
      name: c.name,
      district: c.district,
      state: c.state || '',
      country: 'India',
      latitude: c.latitude || 20.5937,
      longitude: c.longitude || 78.9629,
      displayName: `${c.name}, ${c.state ? `${c.state}, ` : ''}India`,
    }));

  // 2. Fetch worldwide results from OpenStreetMap Nominatim
  let osmMatches: LocationResult[] = [];
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '8');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'VegetationNDVIAnalyzer/2.0 (student capstone project)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(4500),
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const results = await response.json();

      osmMatches = results
        .filter((item: any) => item.lat && item.lon)
        .map((item: any) => {
          const address = item.address ?? {};

          const name =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            item.name ||
            query;

          const state =
            address.state || address.region || address.state_district || '';

          const country = address.country || '';

          const district =
            address.county ||
            address.state_district ||
            address.city ||
            address.town ||
            address.village ||
            name;

          return {
            name,
            district,
            state,
            country,
            latitude: Number(item.lat),
            longitude: Number(item.lon),
            osmType: item.osm_type || '',
            osmId: item.osm_id ?? null,
            displayName:
              item.display_name ||
              [name, state, country].filter(Boolean).join(', '),
          };
        });
    }
  } catch (error) {
    // If Nominatim times out, we still return local matches gracefully
    console.warn('Nominatim lookup warning:', error);
  }

  // Merge: Prioritize exact matching local results, then append unique OSM results
  const combined: LocationResult[] = [...localMatches];
  for (const osm of osmMatches) {
    const isDuplicate = combined.some(
      (m) =>
        m.name.toLowerCase() === osm.name.toLowerCase() &&
        m.country.toLowerCase() === osm.country.toLowerCase()
    );
    if (!isDuplicate) {
      combined.push(osm);
    }
  }

  return NextResponse.json(combined.slice(0, 10));
}
