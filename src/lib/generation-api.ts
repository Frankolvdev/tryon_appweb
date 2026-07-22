import { apiFetch } from "@/lib/api";
import type { GenerationExecution, GenerationModule, GenerationModuleList } from "@/types/generation";
export const listGenerationModules = (category?: string) => apiFetch<GenerationModuleList>(`/api/v1/generation-modules/${category ? `?category=${encodeURIComponent(category)}` : ""}`);
export const getGenerationModule = (id: number) => apiFetch<GenerationModule>(`/api/v1/generation-modules/${id}`);
export const executeGenerationModule = (id: number, inputs: Record<string, unknown>) => apiFetch<GenerationExecution>(`/api/v1/generation-modules/${id}/executions`, { method: "POST", body: JSON.stringify({ inputs, engine: "simulated" }) });
export const getGenerationExecution = (id: string) => apiFetch<GenerationExecution>(`/api/v1/generation-modules/executions/${id}/status`);
export const cancelGenerationExecution = (id: string) => apiFetch<GenerationExecution>(`/api/v1/generation-modules/executions/${id}/cancel`, { method: "POST" });
