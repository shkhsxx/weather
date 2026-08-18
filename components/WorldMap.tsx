"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { LANDMARKS, type Landmark } from "@/data/landmarks";
import type { WeatherMap } from "@/lib/hooks";
import { wmoLabelKo } from "@/lib/weather";

const WIDTH = 960;
const HEIGHT = 500;

interface WorldMapProps {
  weather: WeatherMap;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function weatherIcon(code: number | undefined): string {
  if (code === undefined) return "•";
  if (code <= 1) return "☀️";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67 || (code >= 80 && code <= 82)) return "🌧️";
  if (code <= 77 || (code >= 85 && code <= 86)) return "❄️";
  return "⛈️";
}

export default function WorldMap({ weather, selectedId, onSelect }: WorldMapProps) {
  const [land, setLand] = useState<GeoJSON.FeatureCollection | null>(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    fetch("/world-land-110m.json")
      .then((res) => res.json())
      .then((topo: Topology) => {
        const geo = feature(topo, topo.objects.land as GeometryCollection);
        setLand(geo as unknown as GeoJSON.FeatureCollection);
      })
      .catch(() => setLand(null));
  }, []);

  const projection = useMemo(
    () =>
      geoEquirectangular()
        .scale(WIDTH / (2 * Math.PI))
        .translate([WIDTH / 2, HEIGHT / 2]),
    [],
  );
  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const landPath = useMemo(() => (land ? pathGenerator(land as never) ?? "" : ""), [land, pathGenerator]);

  const pins = useMemo(
    () =>
      LANDMARKS.map((landmark) => {
        const coords = projection([landmark.lon, landmark.lat]);
        return { landmark, coords };
      }).filter((p): p is { landmark: Landmark; coords: [number, number] } => Boolean(p.coords)),
    [projection],
  );

  function clampScale(s: number) {
    return Math.min(4, Math.max(1, s));
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    setTransform((prev) => ({ ...prev, scale: clampScale(prev.scale - e.deltaY * 0.002) }));
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y };
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTransform((prev) => ({ ...prev, x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div className="map-wrap">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="map-svg"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="img"
        aria-label="세계지도"
      >
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`} style={{ transformOrigin: "center" }}>
          <path d={landPath} className="map-land" />
          {pins.map(({ landmark, coords }) => {
            const w = weather[landmark.id];
            const temp = w?.current?.temperature_2m;
            const code = w?.current?.weather_code;
            const isSelected = selectedId === landmark.id;
            return (
              <g
                key={landmark.id}
                transform={`translate(${coords[0]} ${coords[1]})`}
                className="pin-group"
                tabIndex={0}
                role="button"
                aria-label={`${landmark.nameKo}, ${landmark.city}`}
                onClick={() => onSelect(landmark.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelect(landmark.id);
                }}
                onMouseEnter={() => setHoveredId(landmark.id)}
                onMouseLeave={() => setHoveredId((id) => (id === landmark.id ? null : id))}
              >
                <circle r={isSelected ? 7 : 5} className={`pin-dot ${isSelected ? "pin-dot-selected" : ""}`} />
                <circle r={14} className="pin-hit" />
                {temp !== undefined && (
                  <g transform="translate(9 -6)">
                    <rect x={0} y={-9} width={40} height={16} rx={8} className="pin-badge" />
                    <text x={20} y={3} textAnchor="middle" className="pin-badge-text">
                      {weatherIcon(code)} {Math.round(temp)}°
                    </text>
                  </g>
                )}
                {hoveredId === landmark.id && (
                  <g transform="translate(0 -22)">
                    <rect x={-55} y={-24} width={110} height={24} rx={6} className="pin-tooltip-bg" />
                    <text x={0} y={-8} textAnchor="middle" className="pin-tooltip-text">
                      {landmark.nameKo}
                      {w?.current && ` · ${wmoLabelKo(code ?? -1)}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      <div className="map-controls">
        <button
          type="button"
          aria-label="확대"
          onClick={() => setTransform((p) => ({ ...p, scale: clampScale(p.scale + 0.4) }))}
        >
          +
        </button>
        <button
          type="button"
          aria-label="축소"
          onClick={() => setTransform((p) => ({ ...p, scale: clampScale(p.scale - 0.4) }))}
        >
          −
        </button>
        <button type="button" aria-label="초기화" onClick={() => setTransform({ scale: 1, x: 0, y: 0 })}>
          ⟲
        </button>
      </div>
      <style jsx>{`
        .map-wrap {
          position: absolute;
          inset: 0;
        }
        .map-svg {
          width: 100%;
          height: 100%;
          touch-action: none;
          cursor: grab;
        }
        .map-land {
          fill: rgba(255, 255, 255, 0.14);
          stroke: rgba(255, 255, 255, 0.22);
          stroke-width: 0.5;
        }
        .pin-group {
          cursor: pointer;
        }
        .pin-dot {
          fill: var(--color-accent);
          stroke: rgba(0, 0, 0, 0.5);
          stroke-width: 1;
        }
        .pin-dot-selected {
          fill: #ffffff;
          stroke: var(--color-accent);
          stroke-width: 2;
        }
        .pin-hit {
          fill: transparent;
        }
        .pin-badge {
          fill: rgba(10, 12, 20, 0.78);
        }
        .pin-badge-text {
          fill: var(--color-text);
          font-size: 9px;
        }
        .pin-tooltip-bg {
          fill: rgba(10, 12, 20, 0.9);
        }
        .pin-tooltip-text {
          fill: var(--color-text);
          font-size: 10px;
        }
        .map-controls {
          position: absolute;
          right: var(--sp-4);
          bottom: var(--sp-4);
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }
        .map-controls button {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--color-panel-border);
          background: var(--color-panel-bg);
          color: var(--color-text);
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}
