import { apiFetch } from "@/lib/api";
import type { ModelGenerationAssetList, ModelGenerationToolKey } from "@/types/model-generation-asset";

export const listModelGenerationAssets = (tool:ModelGenerationToolKey) =>
  apiFetch<ModelGenerationAssetList>(`/api/v1/model-generation-assets?tool_key=${encodeURIComponent(tool)}`);
