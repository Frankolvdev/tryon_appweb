export const AI_MODEL_DRAFT_NAME_PREFIX = "__draft_model_";
export const LEGACY_AI_MODEL_DRAFT_NAME = "Nueva modelo";

export function isTemporaryAiModelName(name?: string | null) {
  const normalized = (name || "").trim();
  return normalized === LEGACY_AI_MODEL_DRAFT_NAME || normalized.startsWith(AI_MODEL_DRAFT_NAME_PREFIX);
}

export function visibleAiModelName(name?: string | null, fallback = "Modelo") {
  const normalized = (name || "").trim();
  return !normalized || isTemporaryAiModelName(normalized) ? fallback : normalized;
}
