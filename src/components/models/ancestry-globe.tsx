"use client";

import { useEffect, useRef } from "react";
import type { AncestryMediaAsset } from "@/types/ancestry-media";
import styles from "./ancestry-experience.module.css";

type Orientation = { lon: number; lat: number };

function normalizeAngle(value: number) {
  let result = value % 360;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

function easeAngle(current: number, target: number, amount: number) {
  return current + normalizeAngle(target - current) * amount;
}

export function AncestryGlobe({ asset }: { asset: AncestryMediaAsset | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orientationRef = useRef<Orientation>({ lon: 0, lat: 0 });
  const targetRef = useRef<Orientation>({ lon: 0, lat: 0 });

  useEffect(() => {
    if (asset?.longitude != null && asset?.latitude != null) {
      targetRef.current = { lon: -asset.longitude, lat: asset.latitude * 0.55 };
    }
  }, [asset?.id, asset?.latitude, asset?.longitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let animation = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.39;
      context.clearRect(0, 0, w, h);

      const target = targetRef.current;
      const current = orientationRef.current;
      current.lon = easeAngle(current.lon, target.lon, 0.055);
      current.lat += (target.lat - current.lat) * 0.055;
      if (!asset) targetRef.current.lon += 0.09;

      const glow = context.createRadialGradient(cx - radius * .22, cy - radius * .25, radius * .08, cx, cy, radius * 1.18);
      glow.addColorStop(0, "rgba(255,255,255,.045)");
      glow.addColorStop(.62, "rgba(225,29,53,.025)");
      glow.addColorStop(1, "rgba(225,29,53,0)");
      context.fillStyle = glow;
      context.beginPath(); context.arc(cx, cy, radius * 1.18, 0, Math.PI * 2); context.fill();

      context.strokeStyle = "rgba(225,29,53,.28)";
      context.lineWidth = 1;
      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2); context.stroke();
      context.strokeStyle = "rgba(255,255,255,.055)";
      context.beginPath(); context.arc(cx, cy, radius - 2, 0, Math.PI * 2); context.stroke();

      // Holographic latitude ellipses.
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = cy - Math.sin(lat * Math.PI / 180) * radius;
        const rx = Math.cos(lat * Math.PI / 180) * radius;
        context.strokeStyle = lat === 0 ? "rgba(225,29,53,.15)" : "rgba(255,255,255,.055)";
        context.beginPath();
        context.ellipse(cx, y, rx, rx * .15, 0, 0, Math.PI * 2);
        context.stroke();
      }

      // Rotating longitude curves.
      const rotation = current.lon * Math.PI / 180;
      for (let lon = 0; lon < 180; lon += 30) {
        const angle = lon * Math.PI / 180 + rotation;
        const squash = Math.abs(Math.cos(angle));
        context.strokeStyle = `rgba(255,255,255,${0.025 + squash * 0.04})`;
        context.beginPath();
        context.ellipse(cx, cy, Math.max(2, radius * squash), radius, 0, 0, Math.PI * 2);
        context.stroke();
      }

      // Decorative surface particles.
      for (let i = 0; i < 70; i += 1) {
        const a = i * 2.399 + rotation;
        const rr = radius * Math.sqrt((i + .5) / 70);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a * 1.17) * rr * .78;
        const inside = (px-cx)*(px-cx)+(py-cy)*(py-cy) <= radius*radius;
        if (!inside) continue;
        context.fillStyle = i % 9 === 0 ? "rgba(225,29,53,.25)" : "rgba(255,255,255,.10)";
        context.beginPath(); context.arc(px, py, i % 9 === 0 ? 1.15 : .65, 0, Math.PI * 2); context.fill();
      }

      if (asset?.latitude != null && asset?.longitude != null) {
        // Since target rotation centers the longitude, marker approaches the visible center meridian.
        const relativeLon = normalizeAngle(asset.longitude + current.lon) * Math.PI / 180;
        const relativeLat = (asset.latitude - current.lat / .55) * Math.PI / 180;
        const x3 = Math.cos(relativeLat) * Math.sin(relativeLon);
        const y3 = Math.sin(relativeLat);
        const z3 = Math.cos(relativeLat) * Math.cos(relativeLon);
        if (z3 > -.15) {
          const px = cx + x3 * radius;
          const py = cy - y3 * radius;
          const pulse = 1 + Math.sin(frame * .08) * .18;
          context.fillStyle = "rgba(225,29,53,.10)";
          context.beginPath(); context.arc(px, py, 12 * pulse, 0, Math.PI * 2); context.fill();
          context.strokeStyle = "rgba(225,29,53,.42)";
          context.beginPath(); context.arc(px, py, 7 * pulse, 0, Math.PI * 2); context.stroke();
          context.fillStyle = "#e11d35";
          context.beginPath(); context.arc(px, py, 2.5, 0, Math.PI * 2); context.fill();
          context.strokeStyle = "rgba(225,29,53,.25)";
          context.beginPath(); context.moveTo(px, py + 9); context.lineTo(px, Math.min(cy + radius + 12, h - 14)); context.stroke();
        }
      }

      frame += 1;
      animation = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animation);
  }, [asset]);

  const region = asset?.country_code && asset.country_code.length > 2;
  const metaCountry = typeof asset?.metadata?.country_name === "string" ? asset.metadata.country_name : null;

  return <div className={styles.globePanel}>
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    {asset && <div className={styles.location}>
      {region
        ? <span className={styles.region}>{asset.country_code}</span>
        : <span className={styles.locationFlag}>{asset.flag_emoji || "🌐"}</span>}
      <div className={styles.locationCopy}>
        <small>ANCESTRY LOCATION</small>
        <strong>{asset.display_name}</strong>
        <span>{metaCountry || asset.country_code || "Global preset"}</span>
      </div>
    </div>}
  </div>;
}
