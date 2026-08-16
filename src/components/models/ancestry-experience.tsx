"use client";

import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { listAncestryMediaAssets } from "@/lib/ancestry-media-api";
import type { AncestryMediaAsset } from "@/types/ancestry-media";
import { AncestryGlobe } from "./ancestry-globe";
import styles from "./ancestry-experience.module.css";

const STORAGE_PREFIX = "tryon-face-ancestry-v1:";

export function AncestryExperience({
  modelId,
  onChange,
}: {
  modelId: number;
  onChange?: (asset: AncestryMediaAsset | null) => void;
}) {
  const [items, setItems] = useState<AncestryMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listAncestryMediaAssets()
      .then((result) => {
        if (!alive) return;
        const next = [...result.items].sort((a,b) => a.sort_order - b.sort_order || a.id - b.id);
        setItems(next);
        let saved: number | null = null;
        try {
          const raw = localStorage.getItem(`${STORAGE_PREFIX}${modelId}`);
          const parsed = raw ? Number(raw) : NaN;
          if (Number.isFinite(parsed) && next.some((item) => item.id === parsed)) saved = parsed;
        } catch {}
        setSelectedId(saved ?? next[0]?.id ?? null);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "No se pudieron cargar las ascendencias."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [modelId]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  useEffect(() => {
    if (selectedId != null) {
      try { localStorage.setItem(`${STORAGE_PREFIX}${modelId}`, String(selectedId)); } catch {}
    }
    onChange?.(selected);
  }, [modelId, onChange, selected, selectedId]);

  function choose(asset: AncestryMediaAsset) {
    setSelectedId(asset.id);
  }

  function scroll(direction: -1 | 1) {
    trackRef.current?.scrollBy({ left: direction * 520, behavior: "smooth" });
  }

  if (loading) return <section className={styles.shell}><div className={styles.loading}><div><span className={styles.loader}/><span>Cargando ascendencias…</span></div></div></section>;
  if (!items.length) return <section className={styles.shell}><div className={styles.empty}><div><ImageIcon size={26}/><strong>No hay ascendencias publicadas</strong><span>Activa y sube al menos un video/poster desde Tools Generation → Ascendencias de rostro.</span></div></div></section>;

  return <section className={styles.shell}>
    <header className={styles.header}>
      <div>
        <span className={styles.kicker}>ANCESTRY · LIVE IDENTITY</span>
        <h3>Elige su ascendencia</h3>
        <p>Las previews permanecen ligeras; solo la seleccionada cobra vida.</p>
      </div>
      <span className={styles.counter}>{items.length} disponibles</span>
    </header>

    <div className={styles.content}>
      <div className={styles.carouselWrap}>
        <div className={styles.carouselTop}>
          <strong>Featured ancestry</strong>
          <div className={styles.nav}>
            <button type="button" onClick={() => scroll(-1)} aria-label="Anterior"><ChevronLeft size={15}/></button>
            <button type="button" onClick={() => scroll(1)} aria-label="Siguiente"><ChevronRight size={15}/></button>
          </div>
        </div>
        <div className={styles.track} ref={trackRef}>
          {items.map((asset) => {
            const active = asset.id === selectedId;
            const region = Boolean(asset.country_code && asset.country_code.length > 2);
            return <button
              type="button"
              key={asset.id}
              className={`${styles.card} ${active ? styles.cardSelected : ""}`}
              onClick={() => choose(asset)}
              aria-pressed={active}
            >
              <div className={styles.media}>
                {active && asset.video_url ? (
                  <video
                    key={`${asset.id}-${asset.video_url}`}
                    src={asset.video_url}
                    poster={asset.poster_url || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                ) : asset.poster_url ? (
                  <img src={asset.poster_url} alt={asset.display_name} loading="lazy" />
                ) : (
                  <span className={styles.mediaFallback}><ImageIcon size={24}/></span>
                )}
                {active && asset.video_url && <span className={styles.live}>LIVE</span>}
                <span className={styles.shine}/>
              </div>
              <div className={styles.cardFooter}>
                {region
                  ? <span className={styles.region}>{asset.country_code}</span>
                  : <span className={styles.flag}>{asset.flag_emoji || "🌐"}</span>}
                <span className={styles.name}>{asset.display_name}</span>
              </div>
            </button>;
          })}
        </div>
      </div>
      <AncestryGlobe asset={selected}/>
    </div>
  </section>;
}
