"use client";

import { useEffect, useRef, useState } from "react";
import type { ForecastResponse } from "@/lib/weather";

export type WeatherMap = Record<string, ForecastResponse | null>;

interface WeatherFeedState {
  landmarks: WeatherMap;
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
}

const POLL_INTERVAL_MS = 10 * 60 * 1000; // §7.3 — client re-polls the shared 10-minute cache

export function useWeatherFeed() {
  const [state, setState] = useState<WeatherFeedState>({
    landmarks: {},
    fetchedAt: null,
    loading: true,
    error: null,
    stale: false,
  });
  const retryCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function load() {
      if (document.hidden) return; // pause background polling while tab is hidden (§7.3.4)
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = await res.json();
        if (cancelled) return;
        retryCountRef.current = 0;
        setState({
          landmarks: body.landmarks ?? {},
          fetchedAt: body.fetchedAt ?? Date.now(),
          loading: false,
          error: null,
          stale: Boolean(body.stale),
        });
      } catch (err) {
        if (cancelled) return;
        retryCountRef.current += 1;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "network error",
        }));
        if (retryCountRef.current <= 3) {
          const backoff = 1000 * 2 ** (retryCountRef.current - 1);
          setTimeout(load, backoff);
        }
      }
    }

    load();
    timer = setInterval(load, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Ticks once per second with the wall-clock ms at each tick, driving the local clock display. */
export function useNowMs(): number {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return nowMs;
}
