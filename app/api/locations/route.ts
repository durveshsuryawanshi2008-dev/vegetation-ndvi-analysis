import { NextRequest, NextResponse } from 'next/server';
import cities from '@/lib/data/indian-cities.json';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();

  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  const results = cities
    .filter((city) => {
      const name = city.name.toLowerCase();
      const district = city.district.toLowerCase();
      const state = city.state.toLowerCase();

      return (
        name.startsWith(query) ||
        district.startsWith(query) ||
        name.includes(query)
      );
    })
    .slice(0, 10)
    .map((city) => ({
      name: city.name,
      district: city.district,
      state: city.state,
      country: 'India',
      displayName: `${city.name}, ${city.state}, India`,
    }));

  return NextResponse.json(results);
}
