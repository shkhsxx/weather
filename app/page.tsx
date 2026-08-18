"use client";

import { useCallback, useEffect, useState } from "react";
import { LANDMARKS } from "@/data/landmarks";
import type { GeocodeResult } from "@/app/api/geocode/route";
import type { ForecastResponse } from "@/lib/weather";
import { timeBand, wmoToFxGroup, wmoIntensity, localNowFromForecast } from "@/lib/weather";
import { useWeatherFeed, useNowMs } from "@/lib/hooks";
import BackgroundLayer from "@/components/BackgroundLayer";
import WorldMap from "@/components/WorldMap";
import DetailPanel from "@/components/DetailPanel";
import SearchBar from "@/components/SearchBar";
import ListView from "@/components/ListView";
import Footer from "@/components/Footer";

type ViewMode = "map" | "list";

interface CitySpot {
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  forecast: ForecastResponse | null;
  fetchedAt: number;
}

function readInitialState() {
  if (typeof window === "undefined") return { view: "map" as ViewMode, spot: null as string | null };
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view") === "list" ? "list" : "map";
  const spot = params.get("spot");
  return { view: view as ViewMode, spot };
}

export default function Home() {
  const feed = useWeatherFeed();
  const nowMs = useNowMs();
  const [view, setView] = useState<ViewMode>(() => readInitialState().view);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const spot = readInitialState().spot;
    return spot && LANDMARKS.some((l) => l.id === spot) ? spot : null;
  });
  const [citySpot, setCitySpot] = useState<CitySpot | null>(null);
  const [citySpotLoading, setCitySpotLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("view", view);
    if (selectedId) params.set("spot", selectedId);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [view, selectedId]);

  const selectLandmark = useCallback((id: string) => {
    setCitySpot(null);
    setSelectedId(id);
  }, []);

  const selectCity = useCallback(async (result: GeocodeResult) => {
    setSelectedId(null);
    setCitySpotLoading(true);
    try {
      const res = await fetch(`/api/weather/spot?lat=${result.latitude}&lon=${result.longitude}`);
      const body = await res.json();
      setCitySpot({
        name: result.name,
        city: result.name,
        country: result.country ?? "",
        lat: result.latitude,
        lon: result.longitude,
        forecast: body.data ?? null,
        fetchedAt: Date.now(),
      });
    } catch {
      setCitySpot({
        name: result.name,
        city: result.name,
        country: result.country ?? "",
        lat: result.latitude,
        lon: result.longitude,
        forecast: null,
        fetchedAt: Date.now(),
      });
    } finally {
      setCitySpotLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setCitySpot(null);
  }, []);

  const selectedLandmark = selectedId ? LANDMARKS.find((l) => l.id === selectedId) ?? null : null;
  const selectedWeather = selectedId ? feed.landmarks[selectedId] ?? null : citySpot?.forecast ?? null;
  const selectedFetchedAt = selectedId ? feed.fetchedAt : citySpot?.fetchedAt ?? null;

  let band: ReturnType<typeof timeBand>;
  let fx: ReturnType<typeof wmoToFxGroup>;
  let intensity: ReturnType<typeof wmoIntensity>;
  if (selectedWeather && selectedFetchedAt !== null) {
    const localNow = localNowFromForecast(selectedWeather, nowMs - selectedFetchedAt);
    band = timeBand(selectedWeather, localNow);
    fx = wmoToFxGroup(selectedWeather.current.weather_code);
    intensity = wmoIntensity(selectedWeather.current.weather_code);
  } else {
    const hour = new Date(nowMs).getHours();
    band = hour >= 6 && hour < 19 ? "day" : "night";
    fx = "clear";
    intensity = 1;
  }

  const showSplash = feed.loading && Object.keys(feed.landmarks).length === 0;
  const showErrorBanner = Boolean(feed.error) && !showSplash;

  const panelLandmark = selectedLandmark
    ? selectedLandmark
    : citySpot
      ? {
          id: "search-spot",
          nameKo: citySpot.name,
          nameEn: citySpot.name,
          city: citySpot.city,
          country: citySpot.country,
          countryCode: "",
          region: "asia" as const,
          lat: citySpot.lat,
          lon: citySpot.lon,
        }
      : null;

  return (
    <div className="page">
      <BackgroundLayer band={band} fx={fx} intensity={intensity} />

      <header className="top-bar">
        <div className="logo">World Weather Atlas</div>
        <SearchBar onSelectLandmark={selectLandmark} onSelectCity={selectCity} />
        <div className="view-toggle" role="tablist" aria-label="뷰 전환">
          <button
            type="button"
            role="tab"
            aria-selected={view === "map"}
            className={view === "map" ? "active" : ""}
            onClick={() => setView("map")}
          >
            지도
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            리스트
          </button>
        </div>
      </header>

      {showErrorBanner && (
        <div className="error-banner" role="status">
          날씨 정보를 불러오지 못했어요. 캐시된 데이터를 보여드리고 있어요.
          <button type="button" onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </div>
      )}

      <main className="main-area">
        {showSplash ? (
          <div className="splash" role="status" aria-busy="true">
            <div className="splash-spinner" />
            <p>전 세계의 하늘을 불러오는 중…</p>
          </div>
        ) : view === "map" ? (
          <WorldMap weather={feed.landmarks} selectedId={selectedId} onSelect={selectLandmark} />
        ) : (
          <ListView weather={feed.landmarks} fetchedAt={feed.fetchedAt} onSelect={selectLandmark} />
        )}
      </main>

      {panelLandmark && (
        <DetailPanel
          landmark={panelLandmark}
          weather={citySpotLoading ? null : selectedWeather}
          fetchedAt={selectedFetchedAt}
          onClose={closeDetail}
        />
      )}

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }
        .top-bar {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          padding: max(var(--sp-3), env(safe-area-inset-top)) var(--gutter) var(--sp-3);
          z-index: 10;
        }
        .logo {
          font-weight: 700;
          font-size: var(--fs-body);
          white-space: nowrap;
        }
        .view-toggle {
          display: flex;
          gap: var(--sp-1);
          margin-left: auto;
          background: rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-md);
          padding: 2px;
        }
        .view-toggle button {
          min-height: 40px;
          padding: 0 var(--sp-3);
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--color-text-dim);
        }
        .view-toggle button.active {
          background: rgba(255, 255, 255, 0.16);
          color: var(--color-text);
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          margin: 0 var(--gutter) var(--sp-3);
          padding: var(--sp-3) var(--sp-4);
          background: rgba(120, 40, 40, 0.55);
          border: 1px solid rgba(255, 120, 120, 0.4);
          border-radius: var(--radius-md);
          font-size: var(--fs-caption);
        }
        .error-banner button {
          min-height: 32px;
          padding: 0 var(--sp-3);
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          color: var(--color-text);
        }
        .main-area {
          flex: 1;
          position: relative;
          min-height: 0;
          z-index: 1;
        }
        .splash {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--sp-4);
        }
        .splash-spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-top-color: var(--color-accent);
          animation: spin 900ms linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .splash-spinner {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
