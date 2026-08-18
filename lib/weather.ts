export type FxGroup = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";
export type TimeBand = "dawn" | "day" | "dusk" | "night";

export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  is_day: 0 | 1;
  precipitation: number;
  weather_code: number;
  cloud_cover: number;
  wind_speed_10m: number;
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  sunrise: string[];
  sunset: string[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  current: CurrentWeather;
  daily: DailyWeather;
}

export interface LandmarkWeather {
  id: string;
  fetchedAt: number; // client-side Date.now() at receipt, used for the local clock baseline
  data: ForecastResponse | null;
  error?: string;
}

const WMO_LABELS_KO: Record<number, string> = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "서리 안개",
  51: "약한 이슬비",
  53: "이슬비",
  55: "강한 이슬비",
  56: "약한 어는 이슬비",
  57: "강한 어는 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  66: "약한 어는 비",
  67: "강한 어는 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  77: "싸락눈",
  80: "약한 소나기",
  81: "소나기",
  82: "강한 소나기",
  85: "약한 소낙눈",
  86: "강한 소낙눈",
  95: "뇌우",
  96: "우박 동반 뇌우",
  99: "강한 우박 동반 뇌우",
};

const WMO_TO_FX: Record<number, FxGroup> = {
  0: "clear",
  1: "clear",
  2: "cloudy",
  3: "cloudy",
  45: "fog",
  48: "fog",
  51: "rain",
  53: "rain",
  55: "rain",
  56: "rain",
  57: "rain",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "rain",
  67: "rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain",
  81: "rain",
  82: "rain",
  85: "snow",
  86: "snow",
  95: "thunder",
  96: "thunder",
  99: "thunder",
};

// Particle density tier per §4.2 appendix (1=light, 2=medium, 3=heavy). Unmapped codes default to 1.
const WMO_INTENSITY: Record<number, 1 | 2 | 3> = {
  51: 1, 53: 1, 55: 2, 56: 1, 57: 2,
  61: 1, 63: 2, 65: 3, 66: 2, 67: 3,
  71: 1, 73: 2, 75: 3, 77: 1,
  80: 2, 81: 2, 82: 3, 85: 2, 86: 3,
};

export function wmoLabelKo(code: number): string {
  return WMO_LABELS_KO[code] ?? "알 수 없음";
}

export function wmoToFxGroup(code: number): FxGroup {
  return WMO_TO_FX[code] ?? "cloudy";
}

export function wmoIntensity(code: number): 1 | 2 | 3 {
  return WMO_INTENSITY[code] ?? 1;
}

/**
 * Open-Meteo's `current.time` / `daily.sunrise` / `daily.sunset` strings are already the
 * landmark's local wall-clock time (no offset applied). Parsing them as UTC turns them into
 * a timestamp we can do plain arithmetic on — we never need the true UTC instant.
 */
function localWallClockMs(isoNoZone: string): number {
  return new Date(`${isoNoZone}:00Z`).getTime();
}

/**
 * Local "now" is derived from the response's own local timestamp plus elapsed time since
 * fetch — not the requester's device clock (F-02-1).
 */
export function localNowFromForecast(data: ForecastResponse, elapsedMs: number): Date {
  return new Date(localWallClockMs(data.current.time) + elapsedMs);
}

export function timeBand(data: ForecastResponse, now: Date): TimeBand {
  const sunriseStr = data.daily?.sunrise?.[0];
  const sunsetStr = data.daily?.sunset?.[0];

  if (!sunriseStr || !sunsetStr) {
    return data.current.is_day ? "day" : "night";
  }

  const sunrise = localWallClockMs(sunriseStr);
  const sunset = localWallClockMs(sunsetStr);
  const nowMs = now.getTime();
  const hour = 60 * 60 * 1000;

  if (nowMs >= sunrise - hour && nowMs <= sunrise + hour) return "dawn";
  if (nowMs >= sunset - hour && nowMs <= sunset + hour) return "dusk";
  if (nowMs > sunrise + hour && nowMs < sunset - hour) return "day";
  return "night";
}
