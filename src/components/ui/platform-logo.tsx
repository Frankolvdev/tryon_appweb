"use client";

import { useEffect, useMemo, useState } from "react";
import { getPublicBranding, readBrandingCache, resolveBrandAssetUrl } from "@/lib/branding";
import type { BrandingConfig } from "@/types/branding";

type PlatformLogoProps = {
  compact?: boolean;
  height?: number;
  className?: string;
};

function uniqueUrls(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => resolveBrandAssetUrl(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export function PlatformLogo({ compact = false, height = 42, className = "" }: PlatformLogoProps) {
  const [branding, setBranding] = useState<BrandingConfig | null>(() => readBrandingCache());
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    // Cached branding paints immediately; Backend is always revalidated once on mount.
    // Concurrent components share the same in-flight request.
    void getPublicBranding(true).then(setBranding).catch(() => undefined);
  }, []);

  const candidates = useMemo(
    () =>
      compact
        ? uniqueUrls([
            branding?.favicon.url,
            branding?.logo.small_url,
            branding?.logo.medium_url,
            branding?.logo.large_url,
          ])
        : uniqueUrls([
            branding?.logo.medium_url,
            branding?.logo.large_url,
            branding?.logo.small_url,
          ]),
    [branding, compact],
  );

  useEffect(() => {
    // A branding version change produces new asset URLs. Retry from the preferred
    // variant instead of remaining stuck on a previously failed candidate.
    setCandidateIndex(0);
  }, [branding?.version, compact]);

  const source = candidates[candidateIndex] ?? null;

  if (source) {
    return (
      <img
        key={source}
        src={source}
        alt="Logo"
        aria-label={branding?.app_name || "Logo"}
        className={className}
        style={{
          display: "block",
          height,
          width: compact ? height : "100%",
          maxWidth: compact ? height : 252,
          objectFit: "contain",
        }}
        decoding="async"
        loading="eager"
        fetchPriority="high"
        onError={() => setCandidateIndex((index) => index + 1)}
      />
    );
  }

  // Logo-only branding: reserve the layout while loading, but never render a
  // text name or substitute SVG mark in place of the configured logo.
  return (
    <span
      className={className}
      aria-label={branding?.app_name || "Logo"}
      style={{
        display: "block",
        height,
        width: compact ? height : "100%",
        maxWidth: compact ? height : 252,
      }}
    />
  );
}

function upsertFavicon(rel: "icon" | "shortcut icon", href: string, marker: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[data-platform-icon="${marker}"]`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("data-platform-icon", marker);
    document.head.appendChild(link);
  }
  link.rel = rel;
  link.type = "image/png";
  link.href = href;
}

export function BrandingBootstrap() {
  useEffect(() => {
    void getPublicBranding(true)
      .then((branding) => {
        if (branding.app_name) {
          document.title = document.title.replace(/^LUXIA\b/i, branding.app_name);
        }

        const href = resolveBrandAssetUrl(branding.favicon.url);
        if (!href) return;

        // Replace any pre-existing favicon candidates as well. Browsers can otherwise keep
        // preferring a static/older icon relation even after our dynamic one is appended.
        document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]')
          .forEach((link) => {
            link.href = href;
            link.type = "image/png";
          });

        upsertFavicon("icon", href, "primary");
        upsertFavicon("shortcut icon", href, "shortcut");
      })
      .catch(() => undefined);
  }, []);

  return null;
}
