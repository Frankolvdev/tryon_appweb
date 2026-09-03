export type ModelGenerationToolKey = "eyebrows" | "lips" | "hairstyle";
export interface ModelGenerationAsset {
  id: number;
  tool_key: ModelGenerationToolKey;
  asset_key: string;
  title: string;
  value: string;
  sort_order: number;
  poster_url?: string | null;
  video_url?: string | null;
  is_active: boolean;
}
export interface ModelGenerationAssetList { items: ModelGenerationAsset[]; total: number; }
