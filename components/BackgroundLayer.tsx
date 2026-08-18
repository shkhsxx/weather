"use client";

import { useEffect, useRef, useState } from "react";
import type { FxGroup, TimeBand } from "@/lib/weather";
import { useReducedMotion } from "@/lib/hooks";

const TIME_GRADIENTS: Record<TimeBand, string> = {
  dawn: "linear-gradient(180deg, #1b1f3b 0%, #4a3a5c 45%, #f6b88a 100%)",
  day: "linear-gradient(180deg, #3d92d1 0%, #7ec4e8 55%, #cdeaf7 100%)",
  dusk: "linear-gradient(180deg, #2c1b4d 0%, #a8447a 55%, #ff8a4c 100%)",
  night: "linear-gradient(180deg, #05070f 0%, #0b1024 55%, #000000 100%)",
};

interface Layer {
  key: string;
  gradient: string;
  fading: boolean;
}

interface BackgroundLayerProps {
  band: TimeBand;
  fx: FxGroup;
  intensity: 1 | 2 | 3;
}

export default function BackgroundLayer({ band, fx, intensity }: BackgroundLayerProps) {
  const reduceMotion = useReducedMotion();
  const key = `${band}`;
  const [layers, setLayers] = useState<Layer[]>([{ key, gradient: TIME_GRADIENTS[band], fading: false }]);

  // Adjust state during render when `band` changes (React's documented pattern for deriving
  // state from props) — pushes a new top layer and marks the rest as fading out.
  if (layers[layers.length - 1]?.key !== key) {
    setLayers((prev) => {
      const next = prev.map((l) => ({ ...l, fading: true }));
      next.push({ key, gradient: TIME_GRADIENTS[band], fading: false });
      return next;
    });
  }

  // Sweep out fully-faded layers after the cross-fade transition finishes.
  useEffect(() => {
    if (layers.length <= 1) return;
    const timeout = setTimeout(() => {
      setLayers((prev) => prev.filter((l) => l.key === key));
    }, 650);
    return () => clearTimeout(timeout);
  }, [key, layers.length]);

  return (
    <div className="bg-root" aria-hidden="true">
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="bg-gradient-layer"
          style={{ background: layer.gradient, opacity: layer.fading ? 0 : 1 }}
        />
      ))}
      <ParticleCanvas fx={fx} intensity={intensity} band={band} reduceMotion={reduceMotion} />
      <style jsx>{`
        .bg-root {
          position: fixed;
          inset: 0;
          z-index: -2;
          overflow: hidden;
        }
        .bg-gradient-layer {
          position: absolute;
          inset: 0;
          transition: opacity 600ms ease;
          will-change: opacity;
        }
      `}</style>
    </div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

function particleCount(fx: FxGroup, intensity: 1 | 2 | 3, reduceMotion: boolean): number {
  if (reduceMotion) return 0;
  const perf = typeof navigator !== "undefined" && navigator.hardwareConcurrency >= 8 ? 1 : 0.5;
  const base: Record<FxGroup, number> = {
    clear: 60,
    cloudy: 12,
    fog: 0,
    rain: 40 + intensity * 30,
    snow: 30 + intensity * 20,
    thunder: 0,
  };
  return Math.round(base[fx] * perf);
}

function ParticleCanvas({
  fx,
  intensity,
  band,
  reduceMotion,
}: {
  fx: FxGroup;
  intensity: 1 | 2 | 3;
  band: TimeBand;
  reduceMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const flashRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const count = particleCount(fx, intensity, reduceMotion);
    particlesRef.current = Array.from({ length: count }, () => spawnParticle(fx));

    let lastFlash = performance.now() + 3000 + Math.random() * 4000;

    function spawnParticle(kind: FxGroup): Particle {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (kind === "rain") {
        return { x: Math.random() * w, y: Math.random() * h, vx: -0.4, vy: 8 + Math.random() * 4, size: 1, opacity: 0.5 };
      }
      if (kind === "snow") {
        return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.6, vy: 0.6 + Math.random() * 1, size: 2 + Math.random() * 2, opacity: 0.8 };
      }
      if (kind === "clear") {
        return { x: Math.random() * w, y: Math.random() * h * 0.7, vx: 0, vy: 0, size: Math.random() * 1.5 + 0.3, opacity: Math.random() };
      }
      // cloudy
      return { x: Math.random() * w, y: Math.random() * h * 0.4, vx: 0.15 + Math.random() * 0.2, vy: 0, size: 60 + Math.random() * 80, opacity: 0.08 + Math.random() * 0.08 };
    }

    function onVisibility() {
      visibleRef.current = !document.hidden;
    }
    document.addEventListener("visibilitychange", onVisibility);

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick);
      if (!visibleRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      if (fx === "thunder" && now > lastFlash) {
        flashRef.current = 1;
        lastFlash = now + 3000 + Math.random() * 4000;
      }
      if (flashRef.current > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashRef.current * 0.5})`;
        ctx.fillRect(0, 0, w, h);
        flashRef.current = Math.max(0, flashRef.current - 0.08);
      }

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x > w + 100) p.x = -100;
        if (p.x < -100) p.x = w + 100;

        if (fx === "rain") {
          ctx.strokeStyle = `rgba(180,200,255,${p.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y - p.vy * 2);
          ctx.stroke();
        } else if (fx === "snow") {
          ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (fx === "clear") {
          if (band === "night") {
            const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(now / 900 + p.x));
            ctx.fillStyle = `rgba(255,255,255,${p.opacity * twinkle})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (fx === "cloudy") {
          ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fx, intensity, band, reduceMotion]);

  return (
    <>
      <canvas ref={canvasRef} className="bg-canvas" />
      {fx === "fog" && <div className="bg-fog" />}
      {fx === "thunder" && <div className="bg-thunder-dim" />}
      <style jsx>{`
        .bg-canvas {
          position: absolute;
          inset: 0;
        }
        .bg-fog {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(6px);
          background: rgba(230, 235, 240, 0.35);
        }
        .bg-thunder-dim {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </>
  );
}
