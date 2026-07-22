export type GenerationInputType = "image" | "file" | "text" | "integer" | "float" | "boolean" | "json";
export type GenerationExecutionStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export interface GenerationInput { id: number; key: string; name: string; description?: string | null; input_type: GenerationInputType; position: number; is_required: boolean; default_value?: unknown; validation?: Record<string, unknown>; }
export interface GenerationOutput { id: number; key: string; name: string; output_type: string; position: number; is_required: boolean; }
export interface GenerationModule { id: number; key: string; name: string; description?: string | null; version: number; category: string; default_execution_engine: string; metadata: Record<string, unknown>; is_active: boolean; inputs: GenerationInput[]; outputs: GenerationOutput[]; steps: Array<{ id: number; key: string; name: string; step_type: string; position: number; is_enabled: boolean }>; created_at: string; updated_at: string; }
export interface GenerationModuleList { items: GenerationModule[]; total: number; skip: number; limit: number; }
export interface GenerationLog { timestamp: string; level: "info" | "warning" | "error"; step_key?: string | null; message: string; }
export interface GenerationExecution { id: string; module_id: number; module_key: string; engine: "simulated" | "local_docker" | "runpod_serverless"; status: GenerationExecutionStatus; progress: number; inputs: Record<string, unknown>; outputs: Record<string, unknown>; logs: GenerationLog[]; error?: string | null; created_at: string; cancel_requested: boolean; }
export interface GenerationExecutionList { items: GenerationExecution[]; total: number; skip: number; limit: number; }
