import { apiFetch } from "@/lib/api";
import type { TryOnCreateResponse, TryOnItemType, TryOnJob, TryOnQualityMode } from "@/types/tryon";

export async function createTryOn(input: {
  personImage: File;
  itemImage: File;
  itemType: TryOnItemType;
  qualityMode: TryOnQualityMode;
  prompt?: string;
}): Promise<TryOnCreateResponse> {
  const form = new FormData();
  form.append("person_image", input.personImage);
  form.append("item_image", input.itemImage);
  form.append("item_type", input.itemType);
  form.append("quality_mode", input.qualityMode);
  if (input.prompt?.trim()) form.append("prompt", input.prompt.trim());
  return apiFetch<TryOnCreateResponse>("/api/v1/tryon/", { method: "POST", body: form });
}

export async function listTryOnJobs(skip = 0, limit = 50): Promise<TryOnJob[]> {
  return apiFetch<TryOnJob[]>(`/api/v1/tryon/?skip=${skip}&limit=${limit}`);
}
