import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/database';
import { getCountryName, normalizeSearchText } from '@/lib/countries';
import indianCities from '@/lib/data/indian-cities.json';
import { LocationSuggestion } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const queryNormalized = normalizeSearchText(query);
  const queryLower = query.toLowerCase();

  // 1. Primary Source: Local GeoNames Database (236,000+ indexed worldwide cities)
  try {
    const db = getDbPool();
    if (db) {
      const prefixPattern = `${queryNormalized}%`;
      const [rows]: any = await db.query(
        `SELECT 
           geoname_id, name, ascii_name, country_code, admin1_code, admin2_code, 
           latitude, longitude, population, timezone
         FROM geonames_cities
         WHERE normalized_name LIKE ? OR ascii_name LIKE ?
         ORDER BY population DESC
         LIMIT 10`,
        [prefixPattern, prefixPattern]
      );

      // If prefix search returned fewer than 4 results and query >= 3 chars, perform substring search
      let allRows = rows || [];
      if (allRows.length < 4 && queryNormalized.length >= 3) {
        const containsPattern = `%${queryNormalized}%`;
        const existingIds = allRows.map((r: any) => r.geoname_id);
        const [subRows]: any = await db.query(
          `SELECT 
             geoname_id, name, ascii_name, country_code, admin1_code, admin2_code, 
             latitude, longitude, population, timezone
           FROM geonames_cities
           WHERE (normalized_name LIKE ? OR alternate_names LIKE ?)
             ${existingIds.length > 0 ? `AND geoname_id NOT IN (${existingIds.join(',')})` : ''}
           ORDER BY population DESC
           LIMIT ?`,
          [containsPattern, containsPattern, 10 - allRows.length]
        );
        allRows = [...allRows, ...(subRows || [])];
      }

      if (allRows.length > 0) {
        const results: LocationSuggestion[] = allRows.map((r: any) => {
          const country = getCountryName(r.country_code);
          const state = r.admin1_code || '';
          const district = r.admin2_code || r.name;
          const pop = r.population ? Number(r.population) : null;

          return {
            geonameId: Number(r.geoname_id),
            name: r.name,
            asciiName: r.ascii_name,
            district,
            state,
            country,
            countryCode: r.country_code,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            population: pop,
            timezone: r.timezone,
            displayName: `${r.name}, ${state ? `${state}, ` : ''}${country}`,
            source: 'geonames',
          };
        });

        return NextResponse.json(results);
      }
    }
  } catch (dbErr) {
    console.warn('GeoNames database search warning, falling back to local dataset:', dbErr);
  }

  // 2. Secondary Fallback: Local Indian Cities
  const localMatches: LocationSuggestion[] = (indianCities as any[])
    .filter(
      (c) =>
        c.name.toLowerCase().includes(queryLower) ||
        c.district.toLowerCase().includes(queryLower)
    )
    .slice(0, 6)
    .map((c) => ({
      name: c.name,
      district: c.district,
      state: c.state || '',
      country: 'India',
      countryCode: 'IN',
      latitude: Number(c.latitude) || 20.5937,
      longitude: Number(c.longitude) || 78.9629,
      displayName: `${c.name}, ${c.state ? `${c.state}, ` : ''}India`,
      source: 'local',
    }));

  if (localMatches.length > 0) {
    return NextResponse.json(localMatches);
  }

  // 3. Tertiary Fallback: Single-shot detail request to Nominatim (respected rate limits)
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '6');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'VegetationNDVIAnalyzer/2.0 (student capstone project)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (response.ok) {
      const osmData = await response.json();
      const osmResults: LocationSuggestion[] = osmData
        .filter((item: any) => item.lat && item.lon)
        .map((item: any) => {
          const address = item.address ?? {};
          const name = address.city || address.town || address.village || item.name || query;
          const state = address.state || address.region || '';
          const country = address.country || '';
          const countryCode = address.country_code ? address.country_code.toUpperCase() : undefined;

          return {
            name,
            district: address.county || address.state_district || name,
            state,
            country,
            countryCode,
            latitude: Number(item.lat),
            longitude: Number(item.lon),
            displayName: item.display_name || `${name}, ${country}`,
            source: 'osm',
          };
        });

      return NextResponse.json(osmResults);
    }
  } catch (osmErr) {
    console.warn('Nominatim fallback lookup warning:', osmErr);
  }

  return NextResponse.json([]);
}
