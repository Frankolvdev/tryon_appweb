export type TryOnItemType = "clothing" | "shoes";
export type TryOnQualityMode = "standard" | "high";

export type TryOnJob = {
  id: number;
  job_id?: number;
  status?: string;
  item_type?: string;
  quality_mode?: string;
  prompt?: string | null;
  tokens_cost?: number | null;
  result_url?: string | null;
  output_url?: string | null;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TryOnCreateResponse = TryOnJob & {
  job_id?: number;
  message?: string;
};
