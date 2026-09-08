export type ModelGenerationToolKey = "eyebrows" | "lips" | "hairstyle" | "hips" | "butt_size" | "breasts" | "height" | "bubble_butt" | "waist" | "complexion";
export interface ModelGenerationAsset {
  id: number;
  tool_key: ModelGenerationToolKey;
  asset_key: string;
  title: string;
  value: string;
  sort_order: number;
  position?: number | null;
  poster_url?: string | null;
  video_url?: string | null;
  is_active: boolean;
}
export interface ModelGenerationAssetList { items: ModelGenerationAsset[]; total: number; }
