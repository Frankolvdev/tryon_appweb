"use client";

import { useEffect, useRef, useState } from "react";

export type ParticleMorphLoaderConfig = {
  particleCount?: number;
  morphDurationMs?: number;
  holdDurationMs?: number;
  dispersion?: number;
  pointSize?: number;
  silhouetteZoom?: number;
  whiteThreshold?: number;
  scanSpeed?: number;
  scanWidth?: number;
  scanIntensity?: number;
  mainColor?: string;
  accentColor?: string;
};

type ParticleMorphLoaderProps = {
  sourceImages: string[];
  resultUrl?: string | null;
  active: boolean;
  label?: string;
  className?: string;
  progress?: number;
  estimatedSeconds?: number | null;
  onResultAspectRatio?: (ratio: number) => void;
  config?: ParticleMorphLoaderConfig;
};

type TargetPoint = { x: number; y: number };
type Particle = {
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  phase: number;
  speed: number;
  accent: boolean;
};

const DEFAULT_CONFIG: Required<ParticleMorphLoaderConfig> = {
  particleCount: 4500,
  morphDurationMs: 1800,
  holdDurationMs: 900,
  dispersion: 34,
  pointSize: 1.3,
  silhouetteZoom: 1,
  whiteThreshold: 238,
  scanSpeed: 0.27,
  scanWidth: 58,
  scanIntensity: 1.5,
  mainColor: "#d7d7dc",
  accentColor: "#ff3348",
};

function hexRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function ease(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    image.src = src;
  });
  return image;
}

function buildMask(
  image: HTMLImageElement,
  count: number,
  threshold: number,
): TargetPoint[] {
  const off = document.createElement("canvas");
  off.width = 420;
  off.height = 520;
  const g = off.getContext("2d", { willReadFrequently: true });
  if (!g) return [];

  const scale = Math.min(420 / image.width, 520 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  g.clearRect(0, 0, 420, 520);
  g.drawImage(image, (420 - width) / 2, (520 - height) / 2, width, height);

  const pixels = g.getImageData(0, 0, 420, 520).data;
  const candidates: Array<{ x: number; y: number }> = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (let y = 0; y < 520; y += 2) {
    for (let x = 0; x < 420; x += 2) {
      const index = (y * 420 + x) * 4;
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const alpha = pixels[index + 3];
      const luminance = (red + green + blue) / 3;
      const inside = alpha > 35 && (alpha < 245 || luminance < threshold);
      if (!inside) continue;
      candidates.push({ x, y });
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }

  if (!candidates.length) return [];

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const dominant = Math.max(1, maxX - minX, maxY - minY);

  return Array.from({ length: count }, () => {
    const point = candidates[(Math.random() * candidates.length) | 0];
    return {
      x: (point.x - centerX) / dominant,
      y: (point.y - centerY) / dominant,
    };
  });
}

function shuffle<T>(items: T[]) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const target = (Math.random() * (index + 1)) | 0;
    [items[index], items[target]] = [items[target], items[index]];
  }
}

export function ParticleMorphLoader({
  sourceImages,
  resultUrl,
  active,
  label = "GENERATION PREVIEW",
  className = "",
  progress = 0,
  estimatedSeconds = null,
  onResultAspectRatio,
  config,
}: ParticleMorphLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [resultReady, setResultReady] = useState(false);

  const cfg = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    setResultReady(false);
    if (!resultUrl) return;
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth > 0 && image.naturalHeight > 0) {
        onResultAspectRatio?.(image.naturalWidth / image.naturalHeight);
      }
      setResultReady(true);
    };
    image.src = resultUrl;
    return () => {
      image.onload = null;
    };
  }, [resultUrl, onResultAspectRatio]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let disposed = false;
    let raf = 0;
    let masks: TargetPoint[][] = [];
    let particles: Particle[] = [];
    let current = 0;
    let next = 1;
    let phase: "morph" | "hold" = "morph";
    let phaseStarted = performance.now();
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 1;
    let height = 1;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const setTargets = (maskIndex: number) => {
      const targetMask = masks[maskIndex];
      if (!targetMask?.length) return;
      particles.forEach((particle, index) => {
        const target = targetMask[index % targetMask.length];
        particle.sx = particle.x;
        particle.sy = particle.y;
        particle.tx = target.x;
        particle.ty = target.y;
      });
    };

    const initialize = async () => {
      const validSources = sourceImages.filter(Boolean);
      const loaded = await Promise.all(
        validSources.map(async (src) => {
          try {
            return await loadImage(src);
          } catch {
            return null;
          }
        }),
      );

      masks = loaded
        .filter((image): image is HTMLImageElement => Boolean(image))
        .map((image) => buildMask(image, cfg.particleCount, cfg.whiteThreshold))
        .filter((mask) => mask.length > 0);

      if (!masks.length) return;
      masks.forEach(shuffle);

      // If only one image is supplied the scanner still animates over it.
      if (masks.length === 1) masks.push([...masks[0]]);

      particles = masks[0].map((point) => ({
        x: point.x + (Math.random() - 0.5) * 0.4,
        y: point.y + (Math.random() - 0.5) * 0.4,
        sx: point.x,
        sy: point.y,
        tx: point.x,
        ty: point.y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 0.9,
        accent: Math.random() < 0.06,
      }));

      current = 0;
      next = 1 % masks.length;
      setTargets(next);
      phase = "morph";
      phaseStarted = performance.now();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    void initialize();

    const mainRgb = hexRgb(cfg.mainColor);
    const accentRgb = hexRgb(cfg.accentColor);

    const frame = (now: number) => {
      if (disposed) return;
      raf = requestAnimationFrame(frame);

      ctx.clearRect(0, 0, width, height);
      if (!particles.length) return;

      let progress = 1;
      if (phase === "morph") {
        progress = Math.min(1, (now - phaseStarted) / cfg.morphDurationMs);
        const eased = ease(progress);
        const dispersionScale = cfg.dispersion / Math.max(width, height);

        for (const particle of particles) {
          const arc = Math.sin(Math.PI * progress) * dispersionScale;
          particle.x =
            particle.sx +
            (particle.tx - particle.sx) * eased +
            Math.sin(now * 0.0012 * particle.speed + particle.phase) * arc;
          particle.y =
            particle.sy +
            (particle.ty - particle.sy) * eased +
            Math.cos(now * 0.001 * particle.speed + particle.phase * 1.6) * arc;
        }

        if (progress >= 1) {
          phase = "hold";
          phaseStarted = now;
          current = next;
        }
      } else if (now - phaseStarted >= cfg.holdDurationMs) {
        next = (current + 1) % masks.length;
        setTargets(next);
        phase = "morph";
        phaseStarted = now;
      }

      const scale = Math.min(width, height) * 0.9 * cfg.silhouetteZoom;
      const centerX = width / 2;
      const centerY = height / 2;

      const scanT = (now * 0.001 * cfg.scanSpeed) % 1;
      const scanWave = scanT < 0.5 ? scanT * 2 : (1 - scanT) * 2;
      const scanY = height * 0.1 + scanWave * height * 0.8;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const particle of particles) {
        const x = centerX + particle.x * scale;
        const y = centerY + particle.y * scale;
        const influence = Math.max(
          0,
          1 - Math.abs(y - scanY) / Math.max(1, cfg.scanWidth),
        );

        const useAccent = particle.accent || influence > 0.1;
        const color = useAccent ? accentRgb : mainRgb;
        const alpha = Math.min(
          1,
          (useAccent ? 0.26 : 0.2) + influence * 0.65 * cfg.scanIntensity,
        );
        const size =
          cfg.pointSize *
          (useAccent ? 1.2 : 1) *
          (1 + influence * 0.55);

        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Scanner band.
      const bandTop = scanY - cfg.scanWidth * 0.5;
      const gradient = ctx.createLinearGradient(
        0,
        bandTop,
        0,
        scanY + cfg.scanWidth * 0.5,
      );
      gradient.addColorStop(0, "rgba(255,45,70,0)");
      gradient.addColorStop(
        0.5,
        `rgba(255,225,230,${0.08 * cfg.scanIntensity})`,
      );
      gradient.addColorStop(1, "rgba(255,45,70,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, bandTop, width, cfg.scanWidth);

      // Use the exact visual language of the Step 01 body scanner line:
      // transparent edges, red glow and a bright white center. Keep the rest
      // of the particle/HUD animation unchanged.
      ctx.save();
      const scannerLineGradient = ctx.createLinearGradient(0, 0, width, 0);
      scannerLineGradient.addColorStop(0, "rgba(255,70,100,0)");
      scannerLineGradient.addColorStop(0.28, "rgba(255,70,100,0.98)");
      scannerLineGradient.addColorStop(0.5, "rgba(255,255,255,1)");
      scannerLineGradient.addColorStop(0.72, "rgba(255,70,100,0.98)");
      scannerLineGradient.addColorStop(1, "rgba(255,70,100,0)");
      ctx.shadowColor = `rgba(255,45,78,${Math.min(
        1,
        0.92 * cfg.scanIntensity,
      )})`;
      ctx.shadowBlur = 12 * cfg.scanIntensity;
      ctx.fillStyle = scannerLineGradient;
      ctx.fillRect(0, scanY - 1.5, width, 3);
      ctx.restore();

      // Compact HUD.
      ctx.save();
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillStyle = "rgba(255,92,108,.78)";
      ctx.strokeStyle = "rgba(255,70,90,.34)";
      ctx.strokeRect(10, scanY - 18, 10, 36);
      ctx.strokeRect(width - 20, scanY - 18, 10, 36);
      ctx.fillText("ANALYZING", 26, scanY - 7);
      ctx.fillText(
        `${String(Math.round((scanY / height) * 100)).padStart(3, "0")}%`,
        26,
        scanY + 10,
      );
      ctx.restore();
    };

    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [
    sourceImages.join("|"),
    cfg.particleCount,
    cfg.morphDurationMs,
    cfg.holdDurationMs,
    cfg.dispersion,
    cfg.pointSize,
    cfg.silhouetteZoom,
    cfg.whiteThreshold,
    cfg.scanSpeed,
    cfg.scanWidth,
    cfg.scanIntensity,
    cfg.mainColor,
    cfg.accentColor,
  ]);

  const showResult = Boolean(resultUrl && resultReady && !active);

  return (
    <div ref={hostRef} className={`particleMorphLoader ${className}`}>
      <canvas
        ref={canvasRef}
        className={`particleMorphCanvas${showResult ? " isResultReady" : ""}`}
      />

      {showResult && (
        <img
          src={resultUrl!}
          alt="Resultado generado"
          className="particleMorphResult"
        />
      )}

      <div className="particleMorphTop">
        <span>{label}</span>
        <span>{active ? "PROCESSING" : showResult ? "READY" : "FINALIZING"}</span>
      </div>

      {!showResult && (
      <div className="particleMorphStatus particleMorphStatusProgress">
        <div className="particleMorphStatusLine">
          <span>
            <span className="particleMorphStatusDot" />
            {active
              ? "Construyendo identidad…"
              : showResult
                ? "Generación lista"
                : "Preparando preview…"}
          </span>
          <strong>{showResult ? "100%" : `${Math.round(Math.max(0, Math.min(100, progress)))}%`}</strong>
        </div>
        <div className="particleMorphProgressTrack" aria-label="Progreso estimado de generación">
          <span
            className="particleMorphProgressFill"
            style={{ width: `${showResult ? 100 : Math.max(2, Math.min(100, progress))}%` }}
          />
        </div>
        {estimatedSeconds != null && estimatedSeconds > 0 && (
          <small>
            Tiempo estimado: {estimatedSeconds >= 60
              ? `${Math.floor(estimatedSeconds / 60)} min ${Math.round(estimatedSeconds % 60)} s`
              : `${Math.round(estimatedSeconds)} s`}
          </small>
        )}
      </div>
      )}
    </div>
  );
}
