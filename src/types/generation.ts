export type GenerationInputType = "image" | "file" | "text" | "textarea" | "select" | "integer" | "float" | "boolean" | "json";
export type GenerationExecutionStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type GenerationExecutionEngine = "simulated" | "local_docker" | "runpod_serverless" | "modal" | "beam";
export interface GenerationInput { id: number; key: string; name: string; description?: string | null; input_type: GenerationInputType; position: number; is_required: boolean; default_value?: unknown; validation?: Record<string, unknown>; }
export interface GenerationOutput { id: number; key: string; name: string; output_type: string; position: number; is_required: boolean; }
export interface GenerationPricing {
  id: number;
  required_tokens: number;
  final_price_usd: number;
  token_value_usd: number;
  currency: string;
  is_active: boolean;
  estimated_duration_seconds?: number | null;
  estimated_duration_source?: "initial" | "historical_average" | string | null;
  estimated_billable_seconds?: number | null;
  provider?: string | null;
  gpu_key?: string | null;
}

export interface GenerationBillingBreakdown {
  finalized?: boolean;
  provider?: string | null;
  gpu_key?: string | null;
  gpu_cost_usd_per_second?: number | null;
  real_provider_seconds?: number | null;
  configured_scaledown_seconds?: number | null;
  technical_margin_seconds?: number | null;
  billable_seconds?: number | null;
  infrastructure_cost_usd?: number | null;
  desired_profit_usd?: number | null;
  final_price_usd?: number | null;
  token_value_usd?: number | null;
  estimated_tokens_before_execution?: number | null;
  final_tokens?: number | null;
  extra_tokens_debited?: number | null;
  tokens_refunded?: number | null;
  termination_status?: string | null;
  pricing_rule_id?: number | null;
  [key: string]: unknown;
}
export interface GenerationModule { id: number; key: string; name: string; description?: string | null; version: number; category: string; default_execution_engine: GenerationExecutionEngine; metadata: Record<string, unknown>; is_active: boolean; pricing_rule_id?:number|null; pricing?:GenerationPricing|null; inputs: GenerationInput[]; outputs: GenerationOutput[]; steps: Array<{ id: number; key: string; name: string; step_type: string; position: number; is_enabled: boolean }>; created_at: string; updated_at: string; }
export interface GenerationModuleList { items: GenerationModule[]; total: number; skip: number; limit: number; }
export interface GenerationLog { timestamp: string; level: "info" | "warning" | "error"; step_key?: string | null; message: string; }
export interface GenerationExecution { id: string; module_id: number; module_key: string; engine: GenerationExecutionEngine; status: GenerationExecutionStatus; progress: number; inputs: Record<string, unknown>; outputs: Record<string, unknown>; logs: GenerationLog[]; error?: string | null; created_at: string; started_at?: string | null; finished_at?: string | null; duration_ms?: number | null; cancel_requested: boolean; pricing_rule_id?:number|null; tokens_charged:number; tokens_refunded:boolean; currency?:string|null; commercial_price?:number|null; queue_name?:string|null; queue_position?:number|null; provider_status?:string|null; provider_job_id?:string|null; provider_endpoint_id?:string|null; dispatch_attempts?:number; heartbeat_at?:string|null; runtime_metrics?:Record<string, unknown>; provider_metrics?:Record<string, unknown>; real_provider_duration_ms?:number|null; estimated_duration_seconds?:number|null; estimated_duration_source?:string|null; billing_breakdown?:GenerationBillingBreakdown; recovery_count?:number; recovered_at?:string|null; }
export interface GenerationExecutionList { items: GenerationExecution[]; total: number; skip: number; limit: number; }
