export type TryOnItemType = "clothing" | "shoes";
export type TryOnQualityMode = "standard" | "high";
export type TryOnStatus = "queued" | "processing" | "completed" | "failed" | "cancelled" | "timed_out" | string;

export type TryOnJob = {
  id: number;
  user_id?: number;
  person_image_file_id?: number;
  item_image_file_id?: number;
  result_file_id?: number | null;
  status: TryOnStatus;
  item_type: TryOnItemType | string;
  quality_mode: TryOnQualityMode | string;
  prompt?: string | null;
  tokens_cost: number;
  estimated_gpu_seconds?: number | null;
  estimated_gpu_cost_cents?: number | null;
  actual_gpu_seconds?: number | null;
  actual_gpu_cost_cents?: number | null;
  error_message?: string | null;
  runpod_job_id?: string | null;
  comfy_workflow_name?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  result_url?: string | null;
  output_url?: string | null;
};

export type TryOnCreateResponse = Pick<TryOnJob, "id" | "status" | "tokens_cost" | "item_type" | "quality_mode" | "created_at"> & {
  estimated_gpu_seconds?: number | null;
  estimated_gpu_cost_cents?: number | null;
};
