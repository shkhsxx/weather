import { NextResponse } from "next/server";
import { LANDMARKS } from "@/data/landmarks";
import type { ForecastResponse } from "@/lib/weather";

const CACHE_TTL_MS = 10 * 60 * 1000; // §7.3 — shared 10-minute server cache

let cache: { fetchedAt: number; data: Record<string, ForecastResponse | null> } | null = null;
let inflight: Promise<Record<string, ForecastResponse | null>> | null = null;

const CURRENT_FIELDS =
  "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m";
const DAILY_FIELDS = "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset";

async function fetchAllLandmarks(): Promise<Record<string, ForecastResponse | null>> {
  const lat = LANDMARKS.map((l) => l.lat).join(",");
  const lon = LANDMARKS.map((l) => l.lon).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=${CURRENT_FIELDS}&daily=${DAILY_FIELDS}&timezone=auto&forecast_days=3&wind_speed_unit=ms`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new Error(`upstream ${res.status}`);
  }
  const body = await res.json();
  // Multi-coordinate requests return an array; a single coordinate returns one object.
  const list: unknown[] = Array.isArray(body) ? body : [body];

  const result: Record<string, ForecastResponse | null> = {};
  LANDMARKS.forEach((landmark, index) => {
    const entry = list[index];
    result[landmark.id] = (entry as ForecastResponse | undefined) ?? null;
  });
  return result;
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ fetchedAt: cache.fetchedAt, landmarks: cache.data });
  }

  try {
    if (!inflight) {
      inflight = fetchAllLandmarks().finally(() => {
        inflight = null;
      });
    }
    const data = await inflight;
    cache = { fetchedAt: now, data };
    return NextResponse.json({ fetchedAt: now, landmarks: data });
  } catch (err) {
    if (cache) {
      // Serve stale cache on upstream failure rather than a full outage (F-07 principle).
      return NextResponse.json(
        { fetchedAt: cache.fetchedAt, landmarks: cache.data, stale: true },
        { status: 200 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 },
    );
  }
}
