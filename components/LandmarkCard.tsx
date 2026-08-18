"use client";

import type { Landmark } from "@/data/landmarks";
import type { ForecastResponse } from "@/lib/weather";
import { wmoLabelKo, timeBand, localNowFromForecast } from "@/lib/weather";

const BAND_GRADIENT: Record<string, string> = {
  dawn: "linear-gradient(135deg, #1b1f3b, #f6b88a)",
  day: "linear-gradient(135deg, #3d92d1, #cdeaf7)",
  dusk: "linear-gradient(135deg, #2c1b4d, #ff8a4c)",
  night: "linear-gradient(135deg, #05070f, #0b1024)",
};

interface LandmarkCardProps {
  landmark: Landmark;
  weather: ForecastResponse | null;
  fetchedAt: number | null;
  nowMs: number;
  onClick: () => void;
}

export default function LandmarkCard({ landmark, weather, fetchedAt, nowMs, onClick }: LandmarkCardProps) {
  const localTime =
    weather && fetchedAt !== null ? localNowFromForecast(weather, nowMs - fetchedAt) : null;
  const band = weather && localTime ? timeBand(weather, localTime) : "night";

  return (
    <button type="button" className="card" onClick={onClick} style={{ background: BAND_GRADIENT[band] }}>
      <div className="card-overlay">
        <div className="card-top">
          <h3>{landmark.nameKo}</h3>
          <p className="dim">
            {landmark.city} · {landmark.country}
          </p>
        </div>
        {weather ? (
          <div className="card-bottom">
            <span className="card-temp">{Math.round(weather.current.temperature_2m)}°</span>
            <span className="card-desc">{wmoLabelKo(weather.current.weather_code)}</span>
            <span className="card-time">
              {localTime ? `${String(localTime.getUTCHours()).padStart(2, "0")}:${String(localTime.getUTCMinutes()).padStart(2, "0")}` : "--:--"}
            </span>
          </div>
        ) : (
          <div className="card-bottom">
            <span className="card-temp">—</span>
          </div>
        )}
      </div>
      <style jsx>{`
        .card {
          container-type: inline-size;
          position: relative;
          display: block;
          width: 100%;
          min-height: 88px;
          height: 140px;
          padding: 0;
          border: 1px solid var(--color-panel-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          text-align: left;
          cursor: pointer;
          color: var(--color-text);
        }
        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55));
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--sp-3) var(--sp-4);
        }
        h3 {
          margin: 0;
          font-size: var(--fs-body);
        }
        .dim {
          margin: 2px 0 0;
          font-size: var(--fs-caption);
          opacity: 0.85;
        }
        .card-bottom {
          display: flex;
          align-items: baseline;
          gap: var(--sp-2);
        }
        .card-temp {
          font-size: var(--fs-title);
          font-weight: 600;
        }
        .card-desc,
        .card-time {
          font-size: var(--fs-caption);
          opacity: 0.9;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </button>
  );
}
