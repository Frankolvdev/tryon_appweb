"use client";

import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { toast } from "sonner";
import { listAncestryMediaAssets } from "@/lib/ancestry-media-api";
import {
  FACE_COUNTRIES,
  FACE_COUNTRY_BY_CODE,
  type FaceCountry,
} from "@/lib/face-country-catalog";
import type { AncestryMediaAsset } from "@/types/ancestry-media";
import { AncestryGlobe } from "./ancestry-globe";
import styles from "./ancestry-experience.module.css";

const STORAGE_PREFIX = "tryon-face-ancestry-v2:";

function syntheticCountryAsset(country: FaceCountry): AncestryMediaAsset {
  let hash = 0;
  for (const ch of country.code) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return {
    id: -Math.abs(hash || 1),
    ancestry_key: `country:${country.code.toLowerCase()}`,
    display_name: country.name,
    country_code: country.code,
    flag_emoji: country.flag,
    latitude: country.latitude,
    longitude: country.longitude,
    sort_order: 9999,
    storage_mode: "catalog",
    poster_url: null,
    video_url: null,
    is_active: true,
    metadata: {
      country_name: country.name,
      catalog_only: true,
    },
  };
}

function selectionKey(asset: AncestryMediaAsset) {
  if (asset.country_code?.length === 2) return `country:${asset.country_code.toUpperCase()}`;
  return `asset:${asset.id}`;
}

export function AncestryExperience({
  modelId,
  onChange,
}: {
  modelId: number;
  onChange?: (asset: AncestryMediaAsset | null) => void;
}) {
  const [items, setItems] = useState<AncestryMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AncestryMediaAsset | null>(null);
  const [countryModal, setCountryModal] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, startScroll: 0, moved: false });
  const autoDirectionRef = useRef<1 | -1>(1);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    listAncestryMediaAssets()
      .then((result) => {
        if (!alive) return;
        const next = [...result.items].sort(
          (a, b) => a.sort_order - b.sort_order || a.id - b.id,
        );
        setItems(next);

        let restored: AncestryMediaAsset | null = null;
        try {
          const saved = localStorage.getItem(`${STORAGE_PREFIX}${modelId}`);
          if (saved?.startsWith("country:")) {
            const code = saved.slice("country:".length);
            restored =
              next.find((item) => item.country_code?.toUpperCase() === code) ??
              (FACE_COUNTRY_BY_CODE.get(code)
                ? syntheticCountryAsset(FACE_COUNTRY_BY_CODE.get(code)!)
                : null);
          } else if (saved?.startsWith("asset:")) {
            const id = Number(saved.slice("asset:".length));
            restored = next.find((item) => item.id === id) ?? null;
          }
        } catch {}

        setSelected(restored ?? next[0] ?? syntheticCountryAsset(FACE_COUNTRIES[0]));
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las ascendencias.",
        );
        setSelected(syntheticCountryAsset(FACE_COUNTRIES[0]));
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [modelId]);

  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${modelId}`,
        selectionKey(selected),
      );
    } catch {}
    onChange?.(selected);
  }, [modelId, onChange, selected]);

  // Slow living carousel. It pauses while hovered, dragging or the country modal is open.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const track = trackRef.current;
      if (
        track &&
        !hovered &&
        !dragging &&
        !countryModal &&
        track.scrollWidth > track.clientWidth + 4
      ) {
        const dt = Math.min(34, now - last);
        const max = track.scrollWidth - track.clientWidth;
        track.scrollLeft += autoDirectionRef.current * dt * 0.012;

        if (track.scrollLeft >= max - 3) autoDirectionRef.current = -1;
        if (track.scrollLeft <= 3) autoDirectionRef.current = 1;
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [countryModal, dragging, hovered]);

  const countryResults = useMemo(() => {
    const needle = countryQuery.trim().toLowerCase();
    if (!needle) return FACE_COUNTRIES;
    return FACE_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.code.toLowerCase().includes(needle),
    );
  }, [countryQuery]);

  function choose(asset: AncestryMediaAsset) {
    setSelected(asset);
  }

  function chooseCountry(country: FaceCountry) {
    const published =
      items.find(
        (item) => item.country_code?.toUpperCase() === country.code,
      ) ?? null;
    setSelected(published ?? syntheticCountryAsset(country));
    setCountryModal(false);
    setCountryQuery("");
  }

  function chooseCountryCode(code: string) {
    const country = FACE_COUNTRY_BY_CODE.get(code.toUpperCase());
    if (country) chooseCountry(country);
  }

  function scroll(direction: -1 | 1) {
    trackRef.current?.scrollBy({ left: direction * 500, behavior: "smooth" });
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: false,
    };
    setDragging(true);
    track.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 4) dragRef.current.moved = true;
    track.scrollLeft = dragRef.current.startScroll - dx;
  }

  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    dragRef.current.pointerId = -1;
  }

  function safeCardClick(asset: AncestryMediaAsset) {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    choose(asset);
  }

  if (loading) {
    return (
      <section className={styles.shell}>
        <div className={styles.loading}>
          <div>
            <span className={styles.loader} />
            <span>Cargando ascendencias…</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>ANCESTRY · LIVE IDENTITY</span>
          <h3>Elige su ascendencia</h3>
          <p>
            Arrastra el carrusel, toca un país en el globo o busca cualquier país.
            Solo las ascendencias publicadas tienen animación.
          </p>
        </div>
        <span className={styles.counter}>
          {items.length} animadas · {FACE_COUNTRIES.length} países
        </span>
      </header>

      <div className={styles.content}>
        <div className={styles.carouselWrap}>
          <div className={styles.carouselTop}>
            <strong>Featured ancestry</strong>
            <div className={styles.nav}>
              <button type="button" onClick={() => scroll(-1)} aria-label="Anterior">
                <ChevronLeft size={15} />
              </button>
              <button type="button" onClick={() => scroll(1)} aria-label="Siguiente">
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className={styles.trackViewport}>
            <div
              className={`${styles.track} ${dragging ? styles.trackDragging : ""}`}
              ref={trackRef}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={pointerUp}
            >
              {items.map((asset) => {
                const active = selectionKey(asset) === (selected ? selectionKey(selected) : "");
                const region = Boolean(
                  asset.country_code && asset.country_code.length > 2,
                );

                return (
                  <button
                    type="button"
                    key={asset.id}
                    className={`${styles.card} ${
                      active ? styles.cardSelected : ""
                    }`}
                    onClick={() => safeCardClick(asset)}
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
                        <img
                          src={asset.poster_url}
                          alt={asset.display_name}
                          loading="lazy"
                          draggable={false}
                        />
                      ) : (
                        <span className={styles.mediaFallback}>
                          <ImageIcon size={24} />
                        </span>
                      )}
                      {active && asset.video_url && (
                        <span className={styles.live}>LIVE</span>
                      )}
                      <span className={styles.shine} />
                    </div>

                    <div className={styles.cardFooter}>
                      {region ? (
                        <span className={styles.region}>{asset.country_code}</span>
                      ) : (
                        <span className={styles.flag}>
                          {asset.flag_emoji || "🌐"}
                        </span>
                      )}
                      <span className={styles.name}>{asset.display_name}</span>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                className={`${styles.card} ${styles.otherCard}`}
                onClick={() => {
                  if (dragRef.current.moved) {
                    dragRef.current.moved = false;
                    return;
                  }
                  setCountryModal(true);
                }}
              >
                <div className={styles.media}>
                  <div className={styles.shadowAvatar}>
                    <span className={styles.shadowHead} />
                    <span className={styles.shadowBody} />
                    <Globe2 size={23} className={styles.shadowGlobe} />
                  </div>
                  <span className={styles.shine} />
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.otherPlus}>+</span>
                  <span className={styles.name}>Otro país</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <AncestryGlobe
          asset={selected}
          onCountrySelect={chooseCountryCode}
        />
      </div>

      {countryModal && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCountryModal(false);
          }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.kicker}>WORLD ANCESTRY</span>
                <h4>Selecciona otro país</h4>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setCountryModal(false)}
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className={styles.countrySearch}>
              <Search size={17} />
              <input
                autoFocus
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                placeholder="Busca por país o código…"
              />
            </div>

            <div className={styles.countryList}>
              {countryResults.map((country) => {
                const published = items.some(
                  (item) =>
                    item.country_code?.toUpperCase() === country.code,
                );
                return (
                  <button
                    type="button"
                    key={country.code}
                    className={styles.countryRow}
                    onClick={() => chooseCountry(country)}
                  >
                    <span className={styles.countryFlag}>{country.flag}</span>
                    <span className={styles.countryCopy}>
                      <strong>{country.name}</strong>
                      <small>{country.code}</small>
                    </span>
                    {published && <span className={styles.videoReady}>VIDEO</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
