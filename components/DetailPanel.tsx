"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Landmark } from "@/data/landmarks";
import type { ForecastResponse } from "@/lib/weather";
import { localNowFromForecast, wmoLabelKo } from "@/lib/weather";
import { useNowMs } from "@/lib/hooks";

interface DetailPanelProps {
  landmark: Landmark;
  weather: ForecastResponse | null;
  fetchedAt: number | null;
  onClose: () => void;
}

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default function DetailPanel({ landmark, weather, fetchedAt, onClose }: DetailPanelProps) {
  const nowMs = useNowMs();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const localNow = useMemo(() => {
    if (!weather || fetchedAt === null) return null;
    return localNowFromForecast(weather, nowMs - fetchedAt);
  }, [weather, fetchedAt, nowMs]);

  const kstOffsetHours = weather ? Math.round((weather.utc_offset_seconds - 9 * 3600) / 3600) : null;

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${landmark.nameKo} 상세 정보`}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeButtonRef} type="button" className="panel-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        <header className="panel-header">
          <h2>{landmark.nameKo}</h2>
          <p className="panel-sub">
            {landmark.city} · {landmark.country}
          </p>
        </header>

        {!weather ? (
          <div className="panel-error" role="status">
            <p>이 랜드마크의 날씨 정보를 불러오지 못했어요.</p>
          </div>
        ) : (
          <>
            <section className="panel-clock" aria-label="현지 시간">
              <div className="clock-time">{localNow ? formatClock(localNow) : "--:--:--"}</div>
              <div className="clock-meta">
                {localNow ? `${WEEKDAYS_KO[localNow.getDay()]}요일 ${formatDate(localNow)}` : ""}
                {kstOffsetHours !== null && ` · KST ${kstOffsetHours >= 0 ? "+" : ""}${kstOffsetHours}h`}
              </div>
            </section>

            <section className="panel-current">
              <div className="current-temp">{Math.round(weather.current.temperature_2m)}°</div>
              <div className="current-desc">
                <p>{wmoLabelKo(weather.current.weather_code)}</p>
                <p className="dim">체감 {Math.round(weather.current.apparent_temperature)}°</p>
              </div>
            </section>

            <section className="panel-metrics">
              <Metric label="습도" value={`${weather.current.relative_humidity_2m}%`} />
              <Metric label="강수량" value={`${weather.current.precipitation}mm`} />
              <Metric label="풍속" value={`${weather.current.wind_speed_10m}m/s`} />
              <Metric label="구름량" value={`${weather.current.cloud_cover}%`} />
            </section>

            {weather.daily?.sunrise?.[0] && (
              <section className="panel-sun">
                <span>🌅 일출 {formatHHMM(weather.daily.sunrise[0])}</span>
                <span>🌇 일몰 {formatHHMM(weather.daily.sunset[0])}</span>
              </section>
            )}

            {weather.daily?.time?.length > 0 && (
              <section className="panel-forecast">
                <h3>3일 예보</h3>
                <div className="forecast-grid">
                  {weather.daily.time.map((date, i) => (
                    <div key={date} className="forecast-card">
                      <div className="forecast-date">{formatShortDate(date)}</div>
                      <div className="forecast-desc">{wmoLabelKo(weather.daily.weather_code[i])}</div>
                      <div className="forecast-temps">
                        <span>{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                        <span className="dim"> / {Math.round(weather.daily.temperature_2m_min[i])}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="panel-actions">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                }}
              >
                링크 복사
              </button>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .panel-backdrop {
          position: fixed;
          inset: 0;
          z-index: 20;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
        }
        .panel {
          position: relative;
          background: var(--color-panel-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--color-panel-border);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          width: 100%;
          max-height: 88dvh;
          overflow-y: auto;
          padding: var(--sp-6) var(--gutter) calc(var(--sp-8) + env(safe-area-inset-bottom));
        }
        @media (min-width: 1024px) {
          .panel {
            width: 400px;
            max-height: calc(100dvh - 32px);
            margin: var(--sp-4);
            border-radius: var(--radius-lg);
          }
        }
        .panel-close {
          position: absolute;
          top: var(--sp-4);
          right: var(--sp-4);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--color-panel-border);
          background: rgba(255, 255, 255, 0.08);
          color: var(--color-text);
          font-size: 16px;
        }
        .panel-header h2 {
          font-size: var(--fs-title);
          margin: 0;
        }
        .panel-sub {
          margin: var(--sp-1) 0 0;
          color: var(--color-text-dim);
          font-size: var(--fs-caption);
        }
        .panel-clock {
          margin-top: var(--sp-6);
        }
        .clock-time {
          font-size: var(--fs-clock);
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .clock-meta {
          color: var(--color-text-dim);
          font-size: var(--fs-caption);
        }
        .panel-current {
          display: flex;
          align-items: center;
          gap: var(--sp-4);
          margin-top: var(--sp-6);
        }
        .current-temp {
          font-size: var(--fs-temp-lg);
          font-weight: 300;
          line-height: 1;
        }
        .current-desc p {
          margin: 0;
        }
        .dim {
          color: var(--color-text-dim);
        }
        .panel-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--sp-3);
          margin-top: var(--sp-6);
        }
        .panel-sun {
          display: flex;
          justify-content: space-between;
          margin-top: var(--sp-4);
          font-size: var(--fs-caption);
          color: var(--color-text-dim);
        }
        .panel-forecast {
          margin-top: var(--sp-6);
        }
        .panel-forecast h3 {
          font-size: var(--fs-body);
          margin: 0 0 var(--sp-3);
        }
        .forecast-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--sp-2);
        }
        .forecast-card {
          background: rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-md);
          padding: var(--sp-2);
          text-align: center;
          font-size: var(--fs-caption);
        }
        .panel-actions {
          margin-top: var(--sp-6);
        }
        .panel-actions button {
          min-height: 44px;
          padding: 0 var(--sp-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-panel-border);
          background: rgba(255, 255, 255, 0.08);
          color: var(--color-text);
        }
        .panel-error {
          margin-top: var(--sp-6);
        }
      `}</style>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <style jsx>{`
        .metric {
          display: flex;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.06);
          border-radius: var(--radius-md);
          padding: var(--sp-3);
          font-size: var(--fs-caption);
        }
        .metric-label {
          color: var(--color-text-dim);
        }
      `}</style>
    </div>
  );
}

function formatClock(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
function formatDate(d: Date): string {
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
}
function formatHHMM(iso: string): string {
  return iso.slice(11, 16);
}
function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}
