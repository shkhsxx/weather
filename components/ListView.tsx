"use client";

import { useMemo, useState } from "react";
import { LANDMARKS } from "@/data/landmarks";
import type { WeatherMap } from "@/lib/hooks";
import { localNowFromForecast } from "@/lib/weather";
import { useNowMs } from "@/lib/hooks";
import LandmarkCard from "./LandmarkCard";

type SortKey = "default" | "temp-desc" | "temp-asc" | "time" | "name";

interface ListViewProps {
  weather: WeatherMap;
  fetchedAt: number | null;
  onSelect: (id: string) => void;
}

export default function ListView({ weather, fetchedAt, onSelect }: ListViewProps) {
  const nowMs = useNowMs();
  const [sort, setSort] = useState<SortKey>("default");

  const sorted = useMemo(() => {
    const items = [...LANDMARKS];
    if (sort === "temp-desc") {
      items.sort((a, b) => (weather[b.id]?.current.temperature_2m ?? -999) - (weather[a.id]?.current.temperature_2m ?? -999));
    } else if (sort === "temp-asc") {
      items.sort((a, b) => (weather[a.id]?.current.temperature_2m ?? 999) - (weather[b.id]?.current.temperature_2m ?? 999));
    } else if (sort === "name") {
      items.sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
    } else if (sort === "time") {
      items.sort((a, b) => {
        const wa = weather[a.id];
        const wb = weather[b.id];
        const ta = wa && fetchedAt !== null ? localNowFromForecast(wa, nowMs - fetchedAt).getTime() % 86400000 : 0;
        const tb = wb && fetchedAt !== null ? localNowFromForecast(wb, nowMs - fetchedAt).getTime() % 86400000 : 0;
        return ta - tb;
      });
    } else {
      items.sort((a, b) => a.region.localeCompare(b.region));
    }
    return items;
  }, [sort, weather, fetchedAt, nowMs]);

  return (
    <div className="list-view">
      <div className="list-toolbar">
        <label>
          정렬{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="default">기본(대륙별)</option>
            <option value="temp-desc">기온 높은 순</option>
            <option value="temp-asc">기온 낮은 순</option>
            <option value="time">현지 시간 빠른 순</option>
            <option value="name">이름순</option>
          </select>
        </label>
      </div>
      <div className="landmark-grid">
        {sorted.map((landmark) => (
          <div key={landmark.id} className="grid-item">
            <LandmarkCard
              landmark={landmark}
              weather={weather[landmark.id] ?? null}
              fetchedAt={fetchedAt}
              nowMs={nowMs}
              onClick={() => onSelect(landmark.id)}
            />
          </div>
        ))}
      </div>
      <style jsx>{`
        .list-view {
          padding: var(--gutter);
          max-width: 1600px;
          margin: 0 auto;
        }
        .list-toolbar {
          margin-bottom: var(--sp-4);
          font-size: var(--fs-body);
        }
        select {
          min-height: 44px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-panel-border);
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text);
          padding: 0 var(--sp-3);
        }
        .landmark-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .landmark-grid {
            gap: 16px;
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .landmark-grid {
            gap: 20px;
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1440px) {
          .landmark-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
