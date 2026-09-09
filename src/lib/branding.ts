import { env } from "@/lib/env";
import type { BrandingConfig } from "@/types/branding";

const CACHE_KEY = "tryon.public-branding.v1";
const CACHE_MS = 5 * 60_000;
let memory: { at: number; value: BrandingConfig } | null = null;
let inflight: Promise<BrandingConfig> | null = null;

export function resolveBrandAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${env.apiBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function readBrandingCache(): BrandingConfig | null {
  if (memory && Date.now() - memory.at < CACHE_MS) return memory.value;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; value?: BrandingConfig };
    if (!parsed.at || !parsed.value || Date.now() - parsed.at >= CACHE_MS) return null;
    memory = { at: parsed.at, value: parsed.value };
    return parsed.value;
  } catch { return null; }
}

function store(value: BrandingConfig) {
  const entry = { at: Date.now(), value };
  memory = entry;
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry)); } catch { /* cache is optional */ }
  }
}

export function getPublicBranding(force = false): Promise<BrandingConfig> {
  const cached = !force ? readBrandingCache() : null;
  if (cached) return Promise.resolve(cached);
  if (!force && inflight) return inflight;
  inflight = fetch(`${env.apiBaseUrl}/api/v1/system/branding`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("branding unavailable");
      const value = await response.json() as BrandingConfig;
      store(value);
      return value;
    })
    .finally(() => { inflight = null; });
  return inflight;
}
