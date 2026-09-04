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
import { createPortal } from "react-dom";
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
  value,
  onChange,
}: {
  modelId: number;
  value?: AncestryMediaAsset | null;
  onChange?: (asset: AncestryMediaAsset | null) => void;
}) {
  const [items, setItems] = useState<AncestryMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AncestryMediaAsset | null>(null);
  const [hasUserSelection, setHasUserSelection] = useState(false);
  const [countryModal, setCountryModal] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ pointerId: -1, startX: 0, startScroll: 0, moved: false });
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const otherCardRef = useRef<HTMLButtonElement | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!value) return;
    const currentKey = selected ? selectionKey(selected) : null;
    const nextKey = selectionKey(value);
    if (currentKey !== nextKey) setSelected(value);
    setHasUserSelection(true);
  }, [value, selected]);

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

        const initial = value || restored;
        if (initial) {
          const publishedInitial = next.find((item) => selectionKey(item) === selectionKey(initial)) ?? initial;
          setSelected(publishedInitial);
          setHasUserSelection(true);
          onChangeRef.current?.(publishedInitial);
        } else {
          setSelected(null);
          setHasUserSelection(false);
          onChangeRef.current?.(null);
        }
      })
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las ascendencias.",
        );
        setSelected(null);
        setHasUserSelection(false);
        onChangeRef.current?.(null);
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
  }, [modelId, selected]);

  useEffect(() => {
    if (!countryModal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [countryModal]);

  // Deterministic slow loop while there is no active selection.
  // Integer-pixel steps are intentionally used: fractional RAF increments can
  // appear frozen in some browser/scroll-snap combinations.
  useEffect(() => {
    if (selected || dragging || countryModal) return;

    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;

      const max = track.scrollWidth - track.clientWidth;
      if (max <= 4) return;

      const next = track.scrollLeft + 1;
      track.scrollLeft = next >= max - 1 ? 0 : next;
    }, 34);

    return () => window.clearInterval(timer);
  }, [countryModal, dragging, selected]);

  const countryResults = useMemo(() => {
    const needle = countryQuery.trim().toLowerCase();
    if (!needle) return FACE_COUNTRIES;
    return FACE_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.code.toLowerCase().includes(needle),
    );
  }, [countryQuery]);

  const selectedIsOther = Boolean(
    selected &&
      !items.some((item) => selectionKey(item) === selectionKey(selected)),
  );

  function choose(asset: AncestryMediaAsset) {
    setSelected(asset);
    setHasUserSelection(true);
    onChangeRef.current?.(asset);
  }

  function chooseCountry(country: FaceCountry) {
    const published =
      items.find(
        (item) => item.country_code?.toUpperCase() === country.code,
      ) ?? null;
    const next = published ?? syntheticCountryAsset(country);
    choose(next);
    setCountryModal(false);
    setCountryQuery("");
  }

  function chooseCountryCode(code: string) {
    const country = FACE_COUNTRY_BY_CODE.get(code.toUpperCase());
    if (country) chooseCountry(country);
  }

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    let target = track.scrollLeft + direction * Math.max(360, track.clientWidth * 0.72);
    if (direction > 0 && target >= max - 8) target = 0;
    if (direction < 0 && target <= 8) target = max;
    track.scrollTo({ left: target, behavior: "smooth" });
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: false,
    };
    // Pause auto-loop while the user is pressing, but do not capture yet:
    // a normal press on a face card must remain a real click.
    setDragging(true);
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.startX;

    if (!dragRef.current.moved && Math.abs(dx) > 6) {
      dragRef.current.moved = true;
      setDragging(true);
      if (!track.hasPointerCapture(event.pointerId)) {
        track.setPointerCapture(event.pointerId);
      }
    }

    if (!dragRef.current.moved) return;
    event.preventDefault();
    track.scrollLeft = dragRef.current.startScroll - dx;
  }

  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    dragRef.current.pointerId = -1;

    // Keep `moved` through the synthetic click emitted after pointerup,
    // then clear it so the next genuine click is never swallowed.
    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 0);
  }

  function safeCardClick(asset: AncestryMediaAsset) {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    choose(asset);
  }

  useEffect(() => {
    if (!hasUserSelection || !selected) return;
    const published = items.find(
      (item) => selectionKey(item) === selectionKey(selected),
    );
    const node = published
      ? cardRefs.current.get(selectionKey(published))
      : otherCardRef.current;
    if (!node) return;
    const timer = window.setTimeout(() => {
      node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, 40);
    return () => window.clearTimeout(timer);
  }, [hasUserSelection, items, selected]);

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
            El carrusel se mueve hasta que elijas una. Arrástralo, usa las flechas,
            toca un país en el globo o busca cualquier país.
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
              className={`${styles.track} ${dragging ? styles.trackDragging : ""} ${!selected && !dragging && !countryModal ? styles.trackAutoLoop : ""}`}
              ref={trackRef}
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
                    ref={(node) => {
                      const key = selectionKey(asset);
                      if (node) cardRefs.current.set(key, node);
                      else cardRefs.current.delete(key);
                    }}
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
                ref={otherCardRef}
                className={`${styles.card} ${styles.otherCard} ${
                  selectedIsOther ? styles.cardSelected : ""
                }`}
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
                  {selectedIsOther && selected ? (
                    <>
                      <span className={styles.flag}>{selected.flag_emoji || "🌐"}</span>
                      <span className={styles.name}>{selected.display_name}</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.otherPlus}>+</span>
                      <span className={styles.name}>Otro país</span>
                    </>
                  )}
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

      {countryModal && typeof document !== "undefined"
        ? createPortal(
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
                  </div>,
            document.body,
          )
        : null}
    </section>
  );
}
