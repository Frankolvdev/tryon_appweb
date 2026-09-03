export interface AncestryMediaAsset {
  id: number;
  ancestry_key: string;
  display_name: string;
  country_code: string | null;
  flag_emoji: string | null;
  latitude: number | null;
  longitude: number | null;
  sort_order: number;
  storage_mode: string;
  poster_url: string | null;
  video_url: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface AncestryMediaAssetList {
  items: AncestryMediaAsset[];
  total: number;
}
