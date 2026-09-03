import { apiFetch } from "@/lib/api";
import type { AncestryMediaAssetList } from "@/types/ancestry-media";

export const listAncestryMediaAssets = () =>
  apiFetch<AncestryMediaAssetList>("/api/v1/ancestry-assets");
