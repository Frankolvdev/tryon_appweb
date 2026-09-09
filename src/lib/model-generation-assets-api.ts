import { apiFetch } from "@/lib/api";
import type { ModelGenerationAssetList, ModelGenerationToolKey } from "@/types/model-generation-asset";

const assetCatalogCache = new Map<string, { at: number; value: ModelGenerationAssetList }>();
const assetCatalogInflight = new Map<string, Promise<ModelGenerationAssetList>>();
const ASSET_CATALOG_CACHE_MS = 30_000;

export const listModelGenerationAssets = (tool: ModelGenerationToolKey | ModelGenerationToolKey[]) => {
  const query = Array.isArray(tool)
    ? `tool_keys=${encodeURIComponent(tool.join(","))}`
    : `tool_key=${encodeURIComponent(tool)}`;
  const cached = assetCatalogCache.get(query);
  if (cached && Date.now() - cached.at < ASSET_CATALOG_CACHE_MS) return Promise.resolve(cached.value);
  const pending = assetCatalogInflight.get(query);
  if (pending) return pending;
  const request = apiFetch<ModelGenerationAssetList>(`/api/v1/model-generation-assets?${query}`)
    .then((value) => {
      assetCatalogCache.set(query, { at: Date.now(), value });
      return value;
    })
    .finally(() => assetCatalogInflight.delete(query));
  assetCatalogInflight.set(query, request);
  return request;
};
