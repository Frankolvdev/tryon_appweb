import type { GenerationExecution } from "@/types/generation";

export const GENERATION_ACTIVE_STATUSES = ["queued", "running"] as const;
export const GENERATION_TERMINAL_STATUSES = ["completed", "failed", "cancelled"] as const;

const activeStatuses = new Set<string>(GENERATION_ACTIVE_STATUSES);
const terminalStatuses = new Set<string>(GENERATION_TERMINAL_STATUSES);

export function isGenerationProviderPending(execution: GenerationExecution | null | undefined): boolean {
  return Boolean(execution && activeStatuses.has(execution.status));
}

export function isGenerationCancellationPending(execution: GenerationExecution | null | undefined): boolean {
  return Boolean(execution && activeStatuses.has(execution.status) && execution.cancel_requested);
}

export function isGenerationActiveForUi(execution: GenerationExecution | null | undefined): boolean {
  return Boolean(execution && activeStatuses.has(execution.status) && !execution.cancel_requested);
}

export function isGenerationTerminal(execution: GenerationExecution | null | undefined): boolean {
  return Boolean(execution && terminalStatuses.has(execution.status));
}

export function shouldPollGenerationExecution(execution: GenerationExecution | null | undefined): boolean {
  // Cancellation-pending executions stay polled until Backend/provider reaches a terminal state,
  // but they are intentionally not rendered as active generation work.
  return isGenerationProviderPending(execution);
}

export function canRequestGenerationCancellation(execution: GenerationExecution | null | undefined): boolean {
  return isGenerationActiveForUi(execution);
}

export function generationExecutionStatusLabel(execution: GenerationExecution): string {
  if (isGenerationCancellationPending(execution)) return "Cancelando…";
  const labels: Record<string, string> = {
    queued: "En cola",
    running: "Procesando",
    completed: "Completado",
    failed: "Fallido",
    cancelled: "Cancelado",
  };
  return labels[execution.status] ?? execution.status;
}
