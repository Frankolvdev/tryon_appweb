"use client";

import { useEffect, useState } from "react";

const keyFor = (modelId: number) => `tryon-model-display-name:${modelId}`;

export function useModelDisplayName(modelId: number, backendName?: string | null) {
  const [displayName, setDisplayNameState] = useState(backendName || "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(keyFor(modelId));
    setDisplayNameState(stored?.trim() || backendName || "");
  }, [modelId, backendName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<{ modelId: number; name: string }>).detail;
      if (detail?.modelId === modelId) setDisplayNameState(detail.name);
    };
    window.addEventListener("tryon:model-display-name", sync);
    return () => window.removeEventListener("tryon:model-display-name", sync);
  }, [modelId]);

  const setDisplayName = (next: string) => {
    const normalized = next.slice(0, 40);
    setDisplayNameState(normalized);
    if (typeof window !== "undefined") {
      if (normalized.trim()) window.localStorage.setItem(keyFor(modelId), normalized);
      else window.localStorage.removeItem(keyFor(modelId));
      window.dispatchEvent(new CustomEvent("tryon:model-display-name", { detail: { modelId, name: normalized } }));
    }
  };

  return [displayName || backendName || "Modelo", setDisplayName] as const;
}
