import { apiFetch } from "@/lib/api";
import type { ModelGenerationAssetList, ModelGenerationToolKey } from "@/types/model-generation-asset";

export const listModelGenerationAssets = (tool: ModelGenerationToolKey | ModelGenerationToolKey[]) => {
  const query = Array.isArray(tool)
    ? `tool_keys=${encodeURIComponent(tool.join(","))}`
    : `tool_key=${encodeURIComponent(tool)}`;
  return apiFetch<ModelGenerationAssetList>(`/api/v1/model-generation-assets?${query}`);
};
