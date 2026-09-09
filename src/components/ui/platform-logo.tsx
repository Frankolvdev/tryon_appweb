"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { getPublicBranding, readBrandingCache, resolveBrandAssetUrl } from "@/lib/branding";
import type { BrandingConfig } from "@/types/branding";

export function PlatformLogo({ compact = false, height = 42, className = "" }: { compact?: boolean; height?: number; className?: string }) {
  const [branding, setBranding] = useState<BrandingConfig | null>(() => readBrandingCache());
  useEffect(() => {
    // Paint the cached logo immediately, then always revalidate once against Backend.
    // Branding changes are rare, but when they happen a 5-minute local cache must not
    // keep the previous logo visible after a reload. Concurrent callers are deduped.
    void getPublicBranding(true).then(setBranding).catch(() => undefined);
  }, []);
  const source = compact
    ? resolveBrandAssetUrl(branding?.favicon.url ?? branding?.logo.small_url)
    : resolveBrandAssetUrl(branding?.logo.medium_url ?? branding?.logo.small_url);
  if (source) {
    return <img src={source} alt={branding?.app_name || "Cherry Kiss"} className={className} style={{ display: "block", height, width: compact ? height : "auto", maxWidth: compact ? height : 230, objectFit: "contain" }} decoding="async" fetchPriority="high" />;
  }
  return compact
    ? <span className={`appBrandMark ${className}`}><Sparkles size={20} strokeWidth={1.8}/></span>
    : <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span className="appBrandMark"><Sparkles size={20} strokeWidth={1.8}/></span><span className="appBrandCopy"><strong>{branding?.app_name || "LUXIA"}</strong><small>AI STUDIO</small></span></span>;
}

export function BrandingBootstrap() {
  useEffect(() => {
    void getPublicBranding(true).then((branding) => {
      if (branding.app_name) document.title = document.title.replace(/^LUXIA\b/i, branding.app_name);
      const href = resolveBrandAssetUrl(branding.favicon.url);
      if (!href) return;
      let link = document.querySelector<HTMLLinkElement>('link[data-platform-favicon="true"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.setAttribute("data-platform-favicon", "true");
        document.head.appendChild(link);
      }
      // Backend includes ?v=<branding version>, so a changed favicon gets a new URL
      // and cannot be hidden behind the browser's long-lived favicon cache.
      link.type = "image/png";
      link.href = href;

      let shortcut = document.querySelector<HTMLLinkElement>('link[data-platform-shortcut-icon="true"]');
      if (!shortcut) {
        shortcut = document.createElement("link");
        shortcut.rel = "shortcut icon";
        shortcut.setAttribute("data-platform-shortcut-icon", "true");
        document.head.appendChild(shortcut);
      }
      shortcut.type = "image/png";
      shortcut.href = href;
    }).catch(() => undefined);
  }, []);
  return null;
}
