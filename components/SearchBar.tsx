"use client";

import { useEffect, useRef, useState } from "react";
import { LANDMARKS, type Landmark } from "@/data/landmarks";
import type { GeocodeResult } from "@/app/api/geocode/route";

interface SearchBarProps {
  onSelectLandmark: (id: string) => void;
  onSelectCity: (result: GeocodeResult) => void;
}

type ResultItem =
  | { type: "landmark"; landmark: Landmark }
  | { type: "city"; result: GeocodeResult };

export default function SearchBar({ onSelectLandmark, onSelectCity }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cityResults, setCityResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const landmarkMatches: Landmark[] =
    query.trim().length >= 1
      ? LANDMARKS.filter(
          (l) =>
            l.nameKo.includes(query) ||
            l.nameEn.toLowerCase().includes(query.toLowerCase()) ||
            l.city.includes(query),
        ).slice(0, 5)
      : [];

  const trimmedQuery = query.trim();
  const displayedCityResults = trimmedQuery.length < 2 ? [] : cityResults;

  const results: ResultItem[] = [
    ...landmarkMatches.map((landmark) => ({ type: "landmark" as const, landmark })),
    ...displayedCityResults.map((result) => ({ type: "city" as const, result })),
  ];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (trimmedQuery.length < 2) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmedQuery)}`);
        const body = await res.json();
        setCityResults(body.results ?? []);
      } catch {
        setCityResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedQuery]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function selectItem(item: ResultItem) {
    if (item.type === "landmark") onSelectLandmark(item.landmark.id);
    else onSelectCity(item.result);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) selectItem(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showEmpty = query.trim().length >= 2 && !loading && results.length === 0;

  return (
    <div className="search" ref={containerRef}>
      <input
        type="text"
        value={query}
        placeholder="도시나 랜드마크를 검색해 보세요"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        aria-label="도시 또는 랜드마크 검색"
        aria-expanded={open}
        aria-controls="search-results-list"
        role="combobox"
        aria-autocomplete="list"
      />
      {open && (query.trim().length >= 2 || landmarkMatches.length > 0) && (
        <ul id="search-results-list" className="search-dropdown" role="listbox">
          {results.map((item, i) => (
            <li
              key={item.type === "landmark" ? item.landmark.id : `${item.result.id}`}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? "active" : ""}
              onMouseDown={() => selectItem(item)}
            >
              {item.type === "landmark" ? (
                <>
                  <strong>{item.landmark.nameKo}</strong>
                  <span className="dim">
                    {" "}
                    · {item.landmark.city} · {item.landmark.country}
                  </span>
                </>
              ) : (
                <>
                  <strong>{item.result.name}</strong>
                  <span className="dim">
                    {" "}
                    {item.result.admin1 && `· ${item.result.admin1} `}· {item.result.country}
                  </span>
                </>
              )}
            </li>
          ))}
          {showEmpty && <li className="empty">검색 결과가 없어요. 다른 이름으로 시도해 보세요</li>}
        </ul>
      )}
      <style jsx>{`
        .search {
          position: relative;
          width: 100%;
          max-width: 360px;
        }
        input {
          width: 100%;
          min-height: 44px;
          padding: 0 var(--sp-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-panel-border);
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text);
          font-size: 16px;
        }
        input::placeholder {
          color: var(--color-text-dim);
        }
        .search-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: min(400px, 50dvh);
          overflow-y: auto;
          list-style: none;
          margin: 0;
          padding: var(--sp-2);
          background: var(--color-panel-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--color-panel-border);
          border-radius: var(--radius-md);
          z-index: 30;
        }
        .search-dropdown li {
          min-height: 44px;
          display: flex;
          align-items: center;
          padding: var(--sp-2) var(--sp-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--fs-body);
        }
        .search-dropdown li.active,
        .search-dropdown li:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .search-dropdown li.empty {
          color: var(--color-text-dim);
          cursor: default;
        }
        .dim {
          color: var(--color-text-dim);
          font-size: var(--fs-caption);
        }
      `}</style>
    </div>
  );
}
