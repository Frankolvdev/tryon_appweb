export type GenerationExecutionEngine = "simulated" | "local_docker" | "runpod_serverless";
export type GenerationModuleInputType = "image" | "file" | "text" | "textarea" | "select" | "integer" | "float" | "boolean" | "json";
export type GenerationModuleOutputType = "image" | "images" | "file" | "json" | "metadata";
export type GenerationModuleStepType = "workflow" | "python";

export interface GenerationModuleInput {
  id?: number; key: string; name: string; description?: string | null;
  input_type: GenerationModuleInputType; position: number; is_required: boolean;
  default_value?: unknown; validation?: Record<string, unknown>;
}
export interface GenerationModuleOutput {
  id?: number; key: string; name: string; description?: string | null;
  output_type: GenerationModuleOutputType; position: number; is_required: boolean;
  source_step_key?: string | null; source_path?: string | null; metadata?: Record<string, unknown>;
}
export interface GenerationModuleStep {
  id: number; key: string; name: string; description?: string | null;
  step_type: GenerationModuleStepType; position: number; is_enabled: boolean;
  configuration: Record<string, unknown>; input_mapping: Record<string, unknown>;
  output_mapping: Record<string, unknown>; created_at: string; updated_at: string;
}
export interface GenerationModulePricing { id:number; required_tokens:number; final_price_usd:number; token_value_usd:number; currency:string; is_active:boolean; }
export interface GenerationModule {
  id: number; key: string; name: string; description?: string | null; version: number;
  category: string; default_execution_engine: GenerationExecutionEngine;
  metadata: Record<string, unknown>; is_active: boolean; created_by_user_id?: number | null;
  pricing_rule_id?: number | null; pricing?: GenerationModulePricing | null;
  inputs: GenerationModuleInput[]; outputs: GenerationModuleOutput[]; steps: GenerationModuleStep[];
  created_at: string; updated_at: string;
}
export interface GenerationModuleListResponse { items: GenerationModule[]; total: number; skip: number; limit: number; }
export interface WorkflowInputBinding { module_input_key: string; node_id: string; input_field: string; }
export interface WorkflowOutputBinding { module_output_key: string; node_id: string; }

export type GenerationExecutionStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export interface GenerationExecutionLog { timestamp: string; level: "info" | "warning" | "error"; step_key?: string | null; message: string; }
export interface GenerationStepExecution { step_key: string; step_name: string; step_type: string; status: "pending" | "running" | "completed" | "failed" | "cancelled"; started_at?: string | null; finished_at?: string | null; duration_ms?: number | null; outputs: Record<string, unknown>; error?: string | null; }
export interface GenerationModuleExecution { id: string; module_id: number; module_key: string; engine: GenerationExecutionEngine; status: GenerationExecutionStatus; progress: number; inputs: Record<string, unknown>; context: Record<string, unknown>; outputs: Record<string, unknown>; steps: GenerationStepExecution[]; logs: GenerationExecutionLog[]; error?: string | null; created_at: string; started_at?: string | null; finished_at?: string | null; duration_ms?: number | null; cancel_requested: boolean; pricing_rule_id?:number|null; tokens_charged:number; tokens_refunded:boolean; currency?:string|null; commercial_price?:number|null; }

export interface GenerationRuntimeHealthItem { available: boolean; base_url?: string; endpoint_id?: string; error?: string; mode?: string; supports_cancel?: boolean; supports_progress?: boolean; }
export interface GenerationRuntimeHealth { simulated: GenerationRuntimeHealthItem; local_docker: GenerationRuntimeHealthItem; runpod_serverless: GenerationRuntimeHealthItem; }
