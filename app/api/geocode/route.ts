import { NextResponse } from "next/server";

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone: string;
  population?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=ko`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      return NextResponse.json({ error: "upstream error" }, { status: 502 });
    }
    const body = await res.json();
    const results: GeocodeResult[] = (body.results ?? []) as GeocodeResult[];
    results.sort((a, b) => (b.population ?? 0) - (a.population ?? 0));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "geocoding failed" }, { status: 502 });
  }
}
