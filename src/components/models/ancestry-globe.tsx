"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { AncestryMediaAsset } from "@/types/ancestry-media";
import styles from "./ancestry-experience.module.css";

type Orientation = { lon: number; lat: number };
type Coord = [number, number];
type Ring = Coord[];
type Geometry =
  | { type: "Polygon"; coordinates: Ring[] }
  | { type: "MultiPolygon"; coordinates: Ring[][] };
type Feature = {
  type: "Feature";
  properties: { code: string; name: string };
  geometry: Geometry;
};
type FeatureCollection = { type: "FeatureCollection"; features: Feature[] };

const DEG = Math.PI / 180;

function normalizeAngle(value: number) {
  let result = value % 360;
  if (result > 180) result -= 360;
  if (result < -180) result += 360;
  return result;
}

function easeAngle(current: number, target: number, amount: number) {
  return current + normalizeAngle(target - current) * amount;
}

function project(
  lon: number,
  lat: number,
  centerLon: number,
  centerLat: number,
  cx: number,
  cy: number,
  radius: number,
) {
  const lambda = (lon - centerLon) * DEG;
  const phi = lat * DEG;
  const phi0 = centerLat * DEG;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);
  const cosLambda = Math.cos(lambda);

  const x = cosPhi * Math.sin(lambda);
  const y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosLambda;
  const z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosLambda;

  return {
    x: cx + x * radius,
    y: cy - y * radius,
    visible: z > -0.035,
    z,
  };
}

function inverseProject(
  px: number,
  py: number,
  centerLon: number,
  centerLat: number,
  cx: number,
  cy: number,
  radius: number,
): Coord | null {
  const x = (px - cx) / radius;
  const y = -(py - cy) / radius;
  const rho = Math.sqrt(x * x + y * y);
  if (rho > 1) return null;
  if (rho < 1e-6) return [centerLon, centerLat];

  const c = Math.asin(Math.min(1, rho));
  const phi0 = centerLat * DEG;
  const lat = Math.asin(
    Math.cos(c) * Math.sin(phi0) +
      (y * Math.sin(c) * Math.cos(phi0)) / rho,
  );
  const lon =
    centerLon * DEG +
    Math.atan2(
      x * Math.sin(c),
      rho * Math.cos(phi0) * Math.cos(c) -
        y * Math.sin(phi0) * Math.sin(c),
    );

  return [normalizeAngle(lon / DEG), lat / DEG];
}

function pointInRing(point: Coord, ring: Ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    let xi = ring[i][0];
    const yi = ring[i][1];
    let xj = ring[j][0];
    const yj = ring[j][1];

    // Keep dateline polygons locally continuous around the click longitude.
    while (xi - x > 180) xi -= 360;
    while (xi - x < -180) xi += 360;
    while (xj - x > 180) xj -= 360;
    while (xj - x < -180) xj += 360;

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-9) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function featureContains(feature: Feature, point: Coord) {
  const polys =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;

  return polys.some((polygon) => {
    if (!polygon[0] || !pointInRing(point, polygon[0])) return false;
    for (let i = 1; i < polygon.length; i += 1) {
      if (pointInRing(point, polygon[i])) return false;
    }
    return true;
  });
}

export function AncestryGlobe({
  asset,
  onCountrySelect,
}: {
  asset: AncestryMediaAsset | null;
  onCountrySelect?: (code: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const featuresRef = useRef<Feature[]>([]);
  const orientationRef = useRef<Orientation>({ lon: 0, lat: 10 });
  const targetRef = useRef<Orientation>({ lon: 0, lat: 10 });
  const geometryRef = useRef({ cx: 0, cy: 0, radius: 1 });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [globeDragging, setGlobeDragging] = useState(false);
  const globeDragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startLon: 0,
    startLat: 10,
    moved: false,
  });

  useEffect(() => {
    let alive = true;
    fetch("/data/world-countries.geojson")
      .then((response) => response.json())
      .then((data: FeatureCollection) => {
        if (alive) featuresRef.current = data.features;
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (asset?.longitude != null && asset?.latitude != null) {
      targetRef.current = {
        lon: asset.longitude,
        lat: Math.max(-35, Math.min(35, asset.latitude * 0.28)),
      };
    }
  }, [asset?.id, asset?.latitude, asset?.longitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let animation = 0;

    const drawRing = (
      ring: Ring,
      centerLon: number,
      centerLat: number,
      cx: number,
      cy: number,
      radius: number,
    ) => {
      let drawing = false;
      context.beginPath();

      for (const [lon, lat] of ring) {
        const p = project(lon, lat, centerLon, centerLat, cx, cy, radius);
        if (!p.visible) {
          drawing = false;
          continue;
        }

        if (!drawing) {
          context.moveTo(p.x, p.y);
          drawing = true;
        } else {
          context.lineTo(p.x, p.y);
        }
      }
      context.stroke();
    };

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
      const cy = h * 0.43;
      const radius = Math.min(w * 0.43, h * 0.34);
      geometryRef.current = { cx, cy, radius };
      context.clearRect(0, 0, w, h);

      const target = targetRef.current;
      const current = orientationRef.current;
      current.lon = easeAngle(current.lon, target.lon, 0.052);
      current.lat += (target.lat - current.lat) * 0.052;

      const glow = context.createRadialGradient(
        cx - radius * 0.23,
        cy - radius * 0.25,
        radius * 0.06,
        cx,
        cy,
        radius * 1.25,
      );
      glow.addColorStop(0, "rgba(255,255,255,.055)");
      glow.addColorStop(0.58, "rgba(225,29,53,.025)");
      glow.addColorStop(1, "rgba(225,29,53,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.arc(cx, cy, radius * 1.23, 0, Math.PI * 2);
      context.fill();

      const ocean = context.createRadialGradient(
        cx - radius * 0.24,
        cy - radius * 0.28,
        radius * 0.05,
        cx,
        cy,
        radius,
      );
      ocean.addColorStop(0, "rgba(38,42,50,.34)");
      ocean.addColorStop(0.72, "rgba(11,13,17,.72)");
      ocean.addColorStop(1, "rgba(5,6,8,.94)");
      context.fillStyle = ocean;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();

      // Graticule behind the continents.
      context.save();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.clip();
      context.lineWidth = 0.75;

      for (let lat = -60; lat <= 60; lat += 30) {
        const ring: Ring = [];
        for (let lon = -180; lon <= 180; lon += 4) ring.push([lon, lat]);
        context.strokeStyle =
          lat === 0 ? "rgba(225,29,53,.11)" : "rgba(255,255,255,.035)";
        drawRing(ring, current.lon, current.lat, cx, cy, radius);
      }

      for (let lon = -180; lon < 180; lon += 30) {
        const ring: Ring = [];
        for (let lat = -88; lat <= 88; lat += 3) ring.push([lon, lat]);
        context.strokeStyle = "rgba(255,255,255,.03)";
        drawRing(ring, current.lon, current.lat, cx, cy, radius);
      }

      // Real country/continent outlines.
      for (const feature of featuresRef.current) {
        const selectedCountry =
          asset?.country_code?.length === 2 &&
          feature.properties.code === asset.country_code.toUpperCase();
        const hovered = feature.properties.code === hoveredCountry;

        context.lineWidth = selectedCountry ? 1.35 : hovered ? 1.05 : 0.62;
        context.strokeStyle = selectedCountry
          ? "rgba(255,64,89,.84)"
          : hovered
            ? "rgba(255,255,255,.43)"
            : "rgba(210,217,225,.16)";

        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;

        for (const polygon of polygons) {
          for (const ring of polygon) {
            drawRing(ring, current.lon, current.lat, cx, cy, radius);
          }
        }
      }

      context.restore();

      context.strokeStyle = "rgba(225,29,53,.30)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.stroke();

      context.strokeStyle = "rgba(255,255,255,.065)";
      context.beginPath();
      context.arc(cx, cy, radius - 2, 0, Math.PI * 2);
      context.stroke();

      if (asset?.latitude != null && asset?.longitude != null) {
        const marker = project(
          asset.longitude,
          asset.latitude,
          current.lon,
          current.lat,
          cx,
          cy,
          radius,
        );

        if (marker.visible) {
          const pulse = 1 + Math.sin(frame * 0.08) * 0.18;
          context.fillStyle = "rgba(225,29,53,.11)";
          context.beginPath();
          context.arc(marker.x, marker.y, 13 * pulse, 0, Math.PI * 2);
          context.fill();

          context.strokeStyle = "rgba(225,29,53,.48)";
          context.beginPath();
          context.arc(marker.x, marker.y, 7 * pulse, 0, Math.PI * 2);
          context.stroke();

          context.fillStyle = "#e11d35";
          context.beginPath();
          context.arc(marker.x, marker.y, 2.7, 0, Math.PI * 2);
          context.fill();
        }
      }

      frame += 1;
      animation = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animation);
  }, [asset, hoveredCountry]);

  function countryAtEvent(
    event: ReactMouseEvent<HTMLCanvasElement>,
  ): Feature | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const { cx, cy, radius } = geometryRef.current;
    const point = inverseProject(
      event.clientX - rect.left,
      event.clientY - rect.top,
      orientationRef.current.lon,
      orientationRef.current.lat,
      cx,
      cy,
      radius,
    );
    if (!point) return null;

    return (
      featuresRef.current.find((feature) => featureContains(feature, point)) ??
      null
    );
  }

  function globePointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    globeDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLon: orientationRef.current.lon,
      startLat: orientationRef.current.lat,
      moved: false,
    };
    setGlobeDragging(true);
    canvas.setPointerCapture(event.pointerId);
  }

  function globePointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drag = globeDragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;

    const next = {
      lon: normalizeAngle(drag.startLon - dx * 0.42),
      lat: Math.max(-70, Math.min(70, drag.startLat + dy * 0.30)),
    };
    targetRef.current = next;
    orientationRef.current = { ...next };
    setHoveredCountry(null);
    event.preventDefault();
  }

  function globePointerUp(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    globeDragRef.current.pointerId = -1;
    setGlobeDragging(false);
  }

  const region = asset?.country_code && asset.country_code.length > 2;
  const metaCountry =
    typeof asset?.metadata?.country_name === "string"
      ? asset.metadata.country_name
      : null;

  return (
    <div className={styles.globePanel}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseMove={(event) => {
          if (globeDragging) return;
          const feature = countryAtEvent(event);
          setHoveredCountry(feature?.properties.code ?? null);
        }}
        onMouseLeave={() => {
          if (!globeDragging) setHoveredCountry(null);
        }}
        onPointerDown={globePointerDown}
        onPointerMove={globePointerMove}
        onPointerUp={globePointerUp}
        onPointerCancel={globePointerUp}
        onClick={(event) => {
          if (globeDragRef.current.moved) {
            globeDragRef.current.moved = false;
            return;
          }
          const feature = countryAtEvent(event);
          if (feature) onCountrySelect?.(feature.properties.code);
        }}
        data-dragging={globeDragging ? "true" : "false"}
        data-country-hover={hoveredCountry ? "true" : "false"}
        aria-label="Globo interactivo. Arrastra para rotar o toca un país."
      />

      <div className={styles.globeHint}>
        <GlobeIcon />
        <span>Arrastra · toca un país</span>
      </div>

      {asset && (
        <div className={styles.location}>
          {region ? (
            <span className={styles.region}>{asset.country_code}</span>
          ) : (
            <span className={styles.locationFlag}>
              {asset.flag_emoji || "🌐"}
            </span>
          )}
          <div className={styles.locationCopy}>
            <small>ANCESTRY LOCATION</small>
            <strong>{asset.display_name}</strong>
            <span>{metaCountry || asset.country_code || "Global preset"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12S9.8 18.6 12 21" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
