import { apiFetch } from "@/lib/api";
import type { TryOnJob } from "@/types/tryon";

/**
 * Read-only compatibility API for legacy Try-On records.
 * New executions must use src/lib/generation-api.ts so they enter the
 * unified Redis/Local/RunPod orchestration pipeline.
 */
export async function listTryOnJobs(skip = 0, limit = 50): Promise<TryOnJob[]> {
  return apiFetch<TryOnJob[]>(`/api/v1/tryon/?skip=${skip}&limit=${limit}`);
}

export async function getTryOnJob(jobId: number): Promise<TryOnJob> {
  return apiFetch<TryOnJob>(`/api/v1/tryon/${jobId}`);
}
