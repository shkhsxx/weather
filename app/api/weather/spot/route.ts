import { NextResponse } from "next/server";

const CURRENT_FIELDS =
  "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m";
const DAILY_FIELDS = "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat/lon required" }, { status: 400 });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=${CURRENT_FIELDS}&daily=${DAILY_FIELDS}&timezone=auto&forecast_days=3&wind_speed_unit=ms`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 },
    );
  }
}
