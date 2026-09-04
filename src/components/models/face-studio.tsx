"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  Sparkles,
  WandSparkles,
  Pencil,
  Save,
  TriangleAlert,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { useModelDisplayName } from "@/lib/use-model-display-name";
import { finalizeAiModel, getAiModel, listBodyVariants, listBubbleButtVariants, saveAiModelDraft } from "@/lib/ai-model-api";
import { cancelGenerationExecution, executeGenerationModule, getGenerationExecution, listGenerationModules } from "@/lib/generation-api";
import { canRequestGenerationCancellation, isGenerationActiveForUi, isGenerationCancellationPending, isGenerationProviderPending, shouldPollGenerationExecution, isGenerationExecutionPollable  } from "@/lib/generation-execution-contract";
import { useGenerationJobs } from "@/components/generation/generation-jobs-provider";
import { useAppSession } from "@/components/app/app-session";
import { isOwnerAccount } from "@/lib/owner-account";
import { ParticleMorphLoader } from "@/components/generation/particle-morph-loader";
import type { AiModelProfile } from "@/types/ai-model";
import type { GenerationExecution, GenerationModule } from "@/types/generation";
import {
  colorCategories,
  colorOption,
  defaultIdentitySelections,
  buildIdentityPrompt,
  type IdentitySelections,
} from "@/lib/face-option-catalog";
import { listModelGenerationAssets } from "@/lib/model-generation-assets-api";
import { OCCUPATIONS, getOccupationGenerationContext, getOccupationLabel, type OccupationLocale } from "@/lib/occupation-catalog";
import type {
  ModelGenerationAsset,
  ModelGenerationToolKey,
} from "@/types/model-generation-asset";
import type { AncestryMediaAsset } from "@/types/ancestry-media";
import { ModelImage } from "./model-image";
import { ModelGlobalTimeline } from "./model-global-timeline";
import { AncestryExperience } from "./ancestry-experience";
import { useRouter } from "next/navigation";
import { IdentitySourceModal, type ExistingIdentityFile, type IdentitySourceMode } from "./identity-source-modal";
import { downloadLibraryFile } from "@/lib/user-library-api";
import { apiFetch } from "@/lib/api";

const STORAGE_PREFIX = "tryon-face-draft-v2:";

const MEDIA_TOOLS: {
  id: ModelGenerationToolKey;
  label: string;
  hint: string;
}[] = [
  { id: "eyebrows", label: "Eyebrows", hint: "Forma de cejas" },
  { id: "lips", label: "Lips", hint: "Forma de labios" },
  { id: "hairstyle", label: "Hairstyle", hint: "Estilo de cabello" },
];

type StepId =
  | "ancestry"
  | "eyeColor"
  | "eyebrows"
  | "lips"
  | "skinTone"
  | "hairstyle"
  | "hairColor"
  | "occupation"
  | "extraDetails"
  | "identityFace"
  | "summary";

type StepDefinition = {
  id: StepId;
  label: string;
  shortLabel: string;
  hint: string;
  kind: "ancestry" | "color" | "media" | "occupation" | "extra" | "identityFace" | "summary";
  optional?: boolean;
};

const CREATE_IDENTITY_STEPS: StepDefinition[] = [
  {
    id: "ancestry",
    label: "Ascendencia",
    shortLabel: "Ascendencia",
    hint: "Elige arriba la ascendencia de tu modelo",
    kind: "ancestry",
  },
  {
    id: "eyeColor",
    label: "Color de ojos",
    shortLabel: "Ojos",
    hint: "Elige el tono del iris",
    kind: "color",
  },
  {
    id: "eyebrows",
    label: "Cejas",
    shortLabel: "Cejas",
    hint: "Elige la forma de ceja",
    kind: "media",
  },
  {
    id: "lips",
    label: "Labios",
    shortLabel: "Labios",
    hint: "Elige la forma de labios",
    kind: "media",
  },
  {
    id: "skinTone",
    label: "Tono de piel",
    shortLabel: "Piel",
    hint: "Elige el tono base de piel",
    kind: "color",
  },
  {
    id: "hairstyle",
    label: "Peinado",
    shortLabel: "Cabello",
    hint: "Previsualiza y elige el peinado",
    kind: "media",
  },
  {
    id: "hairColor",
    label: "Color de cabello",
    shortLabel: "Color",
    hint: "Elige el color del cabello",
    kind: "color",
  },
  {
    id: "occupation",
    label: "Ocupación",
    shortLabel: "Ocupación",
    hint: "Elige la ocupación para la preview del modelo",
    kind: "occupation",
  },
  {
    id: "extraDetails",
    label: "Extra details",
    shortLabel: "Extra",
    hint: "Detalle opcional de hasta 150 caracteres",
    kind: "extra",
    optional: true,
  },
  {
    id: "summary",
    label: "Resumen",
    shortLabel: "Done",
    hint: "",
    kind: "summary",
  },
];

const EXISTING_IDENTITY_STEPS: StepDefinition[] = [
  {
    id: "ancestry",
    label: "Ascendencia",
    shortLabel: "Ascendencia",
    hint: "Elige arriba la ascendencia de tu modelo",
    kind: "ancestry",
  },
  {
    id: "skinTone",
    label: "Tono de piel",
    shortLabel: "Piel",
    hint: "Elige el tono base de piel",
    kind: "color",
  },
  {
    id: "occupation",
    label: "Ocupación",
    shortLabel: "Ocupación",
    hint: "Elige la ocupación para la preview del modelo",
    kind: "occupation",
  },
  {
    id: "identityFace",
    label: "Rostro de identidad",
    shortLabel: "Rostro",
    hint: "Confirma el rostro que usará la generación",
    kind: "identityFace",
  },
  {
    id: "extraDetails",
    label: "Extra details",
    shortLabel: "Extra",
    hint: "Detalle opcional de hasta 150 caracteres",
    kind: "extra",
    optional: true,
  },
  {
    id: "summary",
    label: "Resumen",
    shortLabel: "Done",
    hint: "",
    kind: "summary",
  },
];

function StepIcon({ id }: { id: StepId }) {
  return (
    <img
      src={`/identity-icons/${id}.svg`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

const BODY_FINE_VALUES = Array.from({ length: 17 }, (_, index) => round1(-0.8 + index * 0.1));
function round1(value: number) { return Math.round((value + Number.EPSILON) * 10) / 10; }

function skinToneGenerationValue(selectionId: string | undefined): number {
  const options = colorCategories.find((category) => category.id === "skinTone")?.options ?? [];
  const selectedIndex = options.findIndex((option) => option.id === selectionId);
  const neutralIndex = options.findIndex((option) => option.id === "medium");

  if (selectedIndex < 0 || neutralIndex < 0) return 0;
  if (selectedIndex === neutralIndex) return 0;

  if (selectedIndex < neutralIndex) {
    return round1(-4 * ((neutralIndex - selectedIndex) / neutralIndex));
  }

  const darkerSteps = options.length - 1 - neutralIndex;
  if (darkerSteps <= 0) return 0;
  return round1(4 * ((selectedIndex - neutralIndex) / darkerSteps));
}

function backendTimestampMs(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
    ? value
    : `${value}Z`;
  return Date.parse(normalized);
}
function signed(value: number) { return `${value > 0 ? "+" : ""}${round1(value).toFixed(1)}`; }
function normalizeBodyDelta(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return round1(Math.min(0.8, Math.max(-0.8, Math.round(number * 10) / 10)));
}

const CREATE_MODEL_WOMAN_MODULE_KEY = "create_model_woman";
const CREATE_MODEL_WOMAN_MODULE_ID = 4;
const CREATE_MODEL_WOMAN_FROM_HEAD_MODULE_ID = 5;
const CREATE_MODEL_WOMAN_INPUT_CONTRACT = [
  { key: "input_1", name: "Hips SIze", type: "float", required: true },
  { key: "input_2", name: "Fat - Thin", type: "float", required: true },
  { key: "input_3", name: "Breasts Size", type: "float", required: true },
  { key: "input_4", name: "Skin Tone", type: "float", required: true },
  { key: "input_5", name: "Hair Length", type: "float", required: true },
  { key: "input_6", name: "Butt Elevation", type: "float", required: true },
  { key: "input_7", name: "Pose", type: "text", required: true },
  { key: "input_8", name: "On", type: "text", required: true },
  { key: "input_9", name: "view", type: "text", required: true },
  { key: "input_10", name: "Action", type: "text", required: true },
  { key: "input_11", name: "Place", type: "text", required: true },
  { key: "input_12", name: "time_day_weather_or_lighting", type: "text", required: true },
  { key: "input_13", name: "Clothes", type: "text", required: true },
  { key: "input_14", name: "extra_details", type: "text", required: false },
  { key: "input_15", name: "prompt_head", type: "text", required: true },
] as const;

const CREATE_MODEL_WOMAN_FROM_HEAD_INPUT_CONTRACT = [
  ...CREATE_MODEL_WOMAN_INPUT_CONTRACT.slice(0, 14),
  { key: "input_15", name: "head", type: "image", required: true },
] as const;

function assertCreateModelWomanContract(module: {
  id: number;
  key: string;
  inputs: Array<{ key: string; name: string; input_type: string; is_required: boolean }>;
}) {
  if (module.id !== CREATE_MODEL_WOMAN_MODULE_ID || module.key !== CREATE_MODEL_WOMAN_MODULE_KEY) {
    throw new Error(`Se esperaba el módulo ${CREATE_MODEL_WOMAN_MODULE_KEY}.`);
  }
  for (const expected of CREATE_MODEL_WOMAN_INPUT_CONTRACT) {
    const actual = module.inputs.find((input) => input.key === expected.key);
    if (!actual) throw new Error(`El módulo ya no contiene ${expected.key} (${expected.name}).`);
    if (actual.input_type !== expected.type) {
      throw new Error(`${expected.key} cambió de tipo: se esperaba ${expected.type} y ahora es ${actual.input_type}.`);
    }
    if (actual.is_required !== expected.required) {
      throw new Error(
        `${expected.key} cambió su obligatoriedad: se esperaba ${expected.required ? "obligatorio" : "opcional"}. Revisa el contrato antes de generar.`,
      );
    }
  }
}

function assertCreateModelWomanFromHeadContract(module: GenerationModule) {
  if (module.id !== CREATE_MODEL_WOMAN_FROM_HEAD_MODULE_ID || module.version !== 2) {
    throw new Error("El módulo de rostro existente debe ser el módulo 5, versión 2.");
  }
  for (const expected of CREATE_MODEL_WOMAN_FROM_HEAD_INPUT_CONTRACT) {
    const actual = module.inputs.find((input) => input.key === expected.key);
    if (!actual) throw new Error(`El módulo 5 ya no contiene ${expected.key} (${expected.name}).`);
    if (actual.input_type !== expected.type || actual.is_required !== expected.required) {
      throw new Error(`El contrato del módulo 5 cambió en ${expected.key}. Revisa el contrato antes de generar.`);
    }
  }
}

function commaPrompt(value: string): string {
  return value
    .split(/,|\n/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

type GeneratedImageResult = {
  storage_file_id?: number;
  download_url?: string | null;
  public_url?: string | null;
  preview_url?: string | null;
  content_type?: string | null;
  filename?: string | null;
};

function collectGeneratedImages(value: unknown, found: GeneratedImageResult[] = []): GeneratedImageResult[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectGeneratedImages(item, found));
    return found;
  }
  if (!value || typeof value !== "object") return found;
  const item = value as Record<string, unknown>;
  const url = item.download_url ?? item.public_url ?? item.preview_url;
  const contentType = String(item.content_type ?? "");
  if (
    (typeof item.storage_file_id === "number" || typeof url === "string") &&
    (contentType.startsWith("image/") || (typeof url === "string" && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)))
  ) {
    found.push(item as GeneratedImageResult);
  }
  Object.values(item).forEach((nested) => collectGeneratedImages(nested, found));
  return found;
}

function generatedImageUrl(file: GeneratedImageResult | null): string | null {
  if (!file) return null;
  return file.preview_url ?? file.public_url ?? file.download_url ?? null;
}

const CREATE_MODEL_WOMAN_BODY_OUTPUT_ID = 137;
const CREATE_MODEL_WOMAN_HEAD_OUTPUT_ID = 138;
const CREATE_MODEL_WOMAN_FROM_HEAD_BODY_OUTPUT_ID = 149;
const CREATE_MODEL_WOMAN_FROM_HEAD_HEAD_OUTPUT_ID = 150;

function outputIdsForModule(module: GenerationModule | null) {
  return module?.id === CREATE_MODEL_WOMAN_FROM_HEAD_MODULE_ID
    ? { body: CREATE_MODEL_WOMAN_FROM_HEAD_BODY_OUTPUT_ID, head: CREATE_MODEL_WOMAN_FROM_HEAD_HEAD_OUTPUT_ID }
    : { body: CREATE_MODEL_WOMAN_BODY_OUTPUT_ID, head: CREATE_MODEL_WOMAN_HEAD_OUTPUT_ID };
}

function generatedImageForOutputId(
  module: GenerationModule | null,
  outputs: Record<string, unknown> | undefined,
  outputId: number,
): GeneratedImageResult | null {
  if (!module || !outputs || module.key !== "create_model_woman") return null;
  const definition = module.outputs.find((item) => item.id === outputId);
  if (!definition) return null;
  return collectGeneratedImages(outputs[definition.key] ?? {})[0] ?? null;
}

function generatedImageForCreateModelOutput(
  module: GenerationModule | null,
  outputs: Record<string, unknown> | undefined,
  outputId: number,
): GeneratedImageResult | null {
  const bound = generatedImageForOutputId(module, outputs, outputId);
  if (bound) return bound;
  // Recovery-safe fallback for persisted executions. Output 137/138 are the
  // frozen Create Model Woman bindings; a temporary module-catalog fetch
  // failure must not make a completed persisted execution impossible to pick.
  const fallbackKey = (outputId === CREATE_MODEL_WOMAN_BODY_OUTPUT_ID || outputId === CREATE_MODEL_WOMAN_FROM_HEAD_BODY_OUTPUT_ID)
    ? "output_1"
    : (outputId === CREATE_MODEL_WOMAN_HEAD_OUTPUT_ID || outputId === CREATE_MODEL_WOMAN_FROM_HEAD_HEAD_OUTPUT_ID)
      ? "output_2"
      : null;
  return fallbackKey && outputs ? collectGeneratedImages(outputs[fallbackKey] ?? {})[0] ?? null : null;
}


function identityDraftSnapshot({
  selections,
  mediaSelected,
  customValues,
  completedSteps,
  activeStep,
  bodyAdjustments,
  bodyBase,
  lastGenerationExecutionId,
}: {
  selections: IdentitySelections;
  mediaSelected: Record<string, string>;
  customValues: Record<string, string>;
  completedSteps: string[];
  activeStep: number;
  bodyAdjustments: { ass: number; fat: number; breasts: number; butt_elevation: number };
  bodyBase: { ass: number; fat: number; breasts: number; butt_elevation: number };
  lastGenerationExecutionId?: string | null;
}) {
  return {
    kind: "identity",
    selections,
    mediaSelected,
    customValues,
    completedSteps,
    activeStep,
    bodyAdjustments,
    bodyRefinements: {
      ass: round1(bodyBase.ass + bodyAdjustments.ass),
      fat: round1(bodyBase.fat + bodyAdjustments.fat),
      breasts: round1(bodyBase.breasts + bodyAdjustments.breasts),
      butt_elevation: round1(bodyBase.butt_elevation + bodyAdjustments.butt_elevation),
    },
    ...(lastGenerationExecutionId
      ? { last_generation_execution_id: lastGenerationExecutionId }
      : {}),
  };
}

export function FaceStudio({ modelId }: { modelId: number }) {
  const router = useRouter();
  const { track } = useGenerationJobs();
  const { user } = useAppSession();
  const owner = isOwnerAccount(user);
  const generationRecoveryRetryRef = useRef<number | null>(null);
  const generationRecoveryMountedRef = useRef(true);
  const [generationModuleInfo, setGenerationModuleInfo] = useState<GenerationModule | null>(null);
  const [progressClock, setProgressClock] = useState(() => Date.now());
  const [generationRecoveryPending, setGenerationRecoveryPending] = useState(true);
  const [generatedAspectRatio, setGeneratedAspectRatio] = useState<number | null>(null);
  const [model, setModel] = useState<AiModelProfile | null>(null);
  const [ancestry, setAncestry] = useState<AncestryMediaAsset | null>(null);
  const [generatingModel, setGeneratingModel] = useState(false);
  const [generatedExecution, setGeneratedExecution] = useState<GenerationExecution | null>(null);
  const [usingGeneratedModel, setUsingGeneratedModel] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [selections, setSelections] =
    useState<IdentitySelections>(defaultIdentitySelections);
  const [mediaAssets, setMediaAssets] = useState<
    Record<string, ModelGenerationAsset[]>
  >({ eyebrows: [], lips: [], hairstyle: [] });
  const [mediaSelected, setMediaSelected] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState("");
  const [occupationModalOpen, setOccupationModalOpen] = useState(false);
  const [occupationSearch, setOccupationSearch] = useState("");
  const [occupationLocale] = useState<OccupationLocale>("es");
  const [bodyRefineOpen, setBodyRefineOpen] = useState(false);
  const [bodyBase, setBodyBase] = useState({ ass: 0, fat: 0, breasts: 0, skin_tone: 0, hair_length: 0, butt_elevation: 0 });
  const [bodyAdjustments, setBodyAdjustments] = useState({ ass: 0, fat: 0, breasts: 0, butt_elevation: 0 });
  const [bodyDraft, setBodyDraft] = useState({ ass: 0, fat: 0, breasts: 0, butt_elevation: 0 });
  const [draftSaving, setDraftSaving] = useState(false);
  const [identityMode, setIdentityMode] = useState<IdentitySourceMode>("create");
  const [existingIdentityFile, setExistingIdentityFile] = useState<ExistingIdentityFile | null>(null);
  const [identitySourceOpen, setIdentitySourceOpen] = useState(false);
  const [cancellingGeneration, setCancellingGeneration] = useState(false);
  const [generationLoadingMode, setGenerationLoadingMode] = useState<"backend" | "elapsed_estimate">("backend");

  useEffect(() => {
    generationRecoveryMountedRef.current = true;
    return () => {
      generationRecoveryMountedRef.current = false;
      if (generationRecoveryRetryRef.current !== null) {
        window.clearTimeout(generationRecoveryRetryRef.current);
        generationRecoveryRetryRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let alive = true;
    listGenerationModules()
      .then((response) => {
        if (!alive) return;
        setGenerationModuleInfo(
          response.items.find((item) => item.id === CREATE_MODEL_WOMAN_MODULE_ID) ?? null,
        );
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    apiFetch<{ public_settings?: Record<string, unknown> }>("/api/v1/system/config")
      .then((config) => {
        if (!alive) return;
        const raw = config.public_settings?.generation_loading_progress_mode;
        setGenerationLoadingMode(raw === "elapsed_estimate" ? "elapsed_estimate" : "backend");
      })
      .catch(() => {
        if (alive) setGenerationLoadingMode("backend");
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    getAiModel(modelId)
      .then((result) => {
        if (result.stage === "studio") {
          router.replace(`/models/${modelId}/studio`);
          return;
        }
        setModel(result);
        try {
          const saved = localStorage.getItem(`${STORAGE_PREFIX}${modelId}`);
          const data = result.draft_json && Object.keys(result.draft_json).length ? result.draft_json : (saved ? JSON.parse(saved) : null);
          if (data) {
            setSelections({
              ...defaultIdentitySelections,
              ...(data.selections || {}),
            });
            setMediaSelected(data.mediaSelected || {});
            setCustomValues(data.customValues || {});
            setIdentityMode(data.identityMode === "existing" ? "existing" : "create");
            setExistingIdentityFile(data.existingIdentityFile || null);
            const restoredCompletedSteps: string[] = Array.isArray(data.completedSteps)
              ? data.completedSteps
              : [];
            setCompletedSteps(restoredCompletedSteps);
            if (data.bodyAdjustments) {
              const safeBody = {
                ass: normalizeBodyDelta(data.bodyAdjustments.ass),
                fat: normalizeBodyDelta(data.bodyAdjustments.fat),
                breasts: normalizeBodyDelta(data.bodyAdjustments.breasts),
                butt_elevation: normalizeBodyDelta(data.bodyAdjustments.butt_elevation),
              };
              setBodyAdjustments(safeBody);
              setBodyDraft(safeBody);
            }
            const restoredMode: IdentitySourceMode = data.identityMode === "existing" ? "existing" : "create";
            const restoredSteps = restoredMode === "existing" ? EXISTING_IDENTITY_STEPS : CREATE_IDENTITY_STEPS;
            const restoredCompletable = restoredSteps.filter((step) => step.kind !== "summary").map((step) => step.id);
            const restoredDoneIndex = restoredSteps.findIndex((step) => step.kind === "summary");
            const restoredIsComplete = restoredCompletable.every((stepId) => restoredCompletedSteps.includes(stepId));
            const restoredStep = restoredIsComplete
              ? restoredDoneIndex
              : Number.isInteger(data.activeStep)
                ? Math.min(Math.max(data.activeStep, 0), restoredSteps.length - 1)
                : 0;
            setActiveStep(restoredStep);

            const lastExecutionId =
              typeof data.last_generation_execution_id === "string"
                ? data.last_generation_execution_id
                : null;
            if (lastExecutionId) {
              // A persisted execution is authoritative. Keep the studio blocked
              // until Backend can reconcile it; if Backend is temporarily down,
              // retry without flashing the previous body/result UI.
              const recoverPersistedExecution = async () => {
                try {
                  const execution = await getGenerationExecution(lastExecutionId);
                  if (!generationRecoveryMountedRef.current) return;
                  setGeneratedExecution(execution);
                  setActiveStep((data.identityMode === "existing" ? EXISTING_IDENTITY_STEPS : CREATE_IDENTITY_STEPS).findIndex((step) => step.kind === "summary"));
                  track(execution, {
                    clickable: true,
                    href: `/models/${modelId}/face`,
                    label: "Create Model IA",
                  });
                  setGenerationRecoveryPending(false);
                  generationRecoveryRetryRef.current = null;
                } catch {
                  if (!generationRecoveryMountedRef.current) return;
                  generationRecoveryRetryRef.current = window.setTimeout(
                    () => void recoverPersistedExecution(),
                    2000,
                  );
                }
              };

              void recoverPersistedExecution();
            } else {
              setGenerationRecoveryPending(false);
            }
          } else {
            setGenerationRecoveryPending(false);
          }
        } catch {
          setGenerationRecoveryPending(false);
        }
      })
      .catch((error) => {
        setGenerationRecoveryPending(false);
        notify.error(
          error instanceof Error
            ? error.message
            : "No se pudo abrir el estudio de rostro",
        );
      });

    Promise.all(
      MEDIA_TOOLS.map(
        async (tool) =>
          [tool.id, (await listModelGenerationAssets(tool.id)).items] as const,
      ),
    )
      .then((entries) => setMediaAssets(Object.fromEntries(entries)))
      .catch(() =>
        notify.error("No se pudieron cargar algunas previews de identidad."),
      );
  }, [modelId, router, track]);

  useEffect(() => {
    if (!model?.body_proportion_preset_id) return;
    Promise.all([
      listBodyVariants(model.sex),
      listBubbleButtVariants(model.body_proportion_preset_id),
    ])
      .then(([catalog, bubbles]) => {
        const body = catalog.items.find((item) => item.id === model.body_proportion_preset_id);
        const bubble = bubbles.items.find((item) => item.id === model.bubble_butt_preset_id)
          || bubbles.items.find((item) => item.variant_index === model.bubble_butt_variant_index);
        setBodyBase({
          ass: body?.hips_size ?? 0,
          fat: body?.fat_thin ?? 0,
          breasts: body?.breasts_size ?? 0,
          skin_tone: body?.skin_tone ?? 0,
          hair_length: body?.hair_length ?? 0,
          butt_elevation: bubble?.bubble_butt ?? 0,
        });
      })
      .catch(() => notify.warning("No se pudieron cargar los valores base del cuerpo para el refinamiento."));
  }, [model?.body_proportion_preset_id, model?.bubble_butt_preset_id, model?.bubble_butt_variant_index, model?.sex]);

  useEffect(() => {
    if (!isGenerationProviderPending(generatedExecution)) return;
    setProgressClock(Date.now());
    const timer = window.setInterval(() => setProgressClock(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [generatedExecution?.id, generatedExecution?.status]);

useEffect(() => {
  const execution = generatedExecution;
  if (!execution || !isGenerationExecutionPollable(execution)) return;

  let cancelled = false;
  const executionId = execution.id;

    const refreshExecution = async () => {
      try {
        const latest = await getGenerationExecution(executionId);
        if (cancelled) return;
        setGeneratedExecution(latest);
        track(latest, {
          clickable: true,
          href: `/models/${modelId}/face`,
          label: "Create Model IA",
        });
        if (latest.status === "failed") {
          notify.error(latest.error || "La generación del modelo falló.");
        }
      } catch {}
    };

    void refreshExecution();
    const timer = window.setInterval(() => void refreshExecution(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [generatedExecution?.id, generatedExecution?.status, modelId, track]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${modelId}`,
        JSON.stringify({
          selections,
          mediaSelected,
          customValues,
          completedSteps,
          activeStep,
          bodyAdjustments,
          identityMode,
          existingIdentityFile,
          bodyRefinements: {
            ass: round1(bodyBase.ass + bodyAdjustments.ass),
            fat: round1(bodyBase.fat + bodyAdjustments.fat),
            breasts: round1(bodyBase.breasts + bodyAdjustments.breasts),
            butt_elevation: round1(bodyBase.butt_elevation + bodyAdjustments.butt_elevation),
          },
          ...(generatedExecution?.id
            ? { last_generation_execution_id: generatedExecution.id }
            : {}),
        }),
      );
    } catch {}
  }, [
    modelId,
    selections,
    mediaSelected,
    customValues,
    completedSteps,
    activeStep,
    bodyAdjustments,
    bodyBase,
    identityMode,
    existingIdentityFile,
    generatedExecution?.id,
  ]);

  async function saveDraft() {
    setDraftSaving(true);
    const draft = {
      ...identityDraftSnapshot({
      selections,
      mediaSelected,
      customValues,
      completedSteps,
      activeStep,
      bodyAdjustments,
      bodyBase,
      lastGenerationExecutionId: generatedExecution?.id,
      }),
      identityMode,
      existingIdentityFile,
    };
    try {
      const updated = await saveAiModelDraft(modelId, draft, displayName.trim() || model?.name);
      setModel(updated);
      notify.success("Borrador guardado");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "No se pudo guardar el borrador");
    } finally { setDraftSaving(false); }
  }

  async function generateModel() {
    // queued/running remains exclusive even while cancellation is pending.
    // Do not allow a second execution until Backend reaches a terminal state.
    if (!model || generatingModel || isGenerationProviderPending(generatedExecution)) return;
    if (!summaryReady) {
      showValidation("Completa los pasos obligatorios antes de generar el modelo.");
      return;
    }
    if (!ancestry) {
      showValidation("Elige una ascendencia antes de generar el modelo.");
      notify.error("La ascendencia es obligatoria para generar.");
      return;
    }

    setGeneratingModel(true);
    setGeneratedAspectRatio(null);
    try {
      // Generar siempre guarda primero el mismo progreso que el botón
      // "Guardar borrador", pero sin un toast intermedio.
      const savedBeforeGeneration = await saveAiModelDraft(
        modelId,
        {
          ...identityDraftSnapshot({
            selections,
            mediaSelected,
            customValues,
            completedSteps,
            activeStep: identityDoneStepIndex,
            bodyAdjustments,
            bodyBase,
            lastGenerationExecutionId: generatedExecution?.id,
          }),
          identityMode,
          existingIdentityFile,
          ancestry: {
            id: ancestry.id,
            ancestry_key: ancestry.ancestry_key,
            display_name: ancestry.display_name,
            country_code: ancestry.country_code,
          },
        },
        displayName.trim() || model.name,
      );
      setModel(savedBeforeGeneration);

      const moduleResponse = await listGenerationModules();
      const generationModule = identityMode === "existing"
        ? moduleResponse.items.find((item) => item.id === CREATE_MODEL_WOMAN_FROM_HEAD_MODULE_ID && item.is_active)
        : moduleResponse.items.find((item) => item.id === CREATE_MODEL_WOMAN_MODULE_ID && item.is_active);
      if (!generationModule) {
        throw new Error(
          identityMode === "existing" ? 'No se encontró activo el módulo 5 "Create Model Woman From Head".' : 'No se encontró activo el módulo anterior "create_model_woman".',
        );
      }
      setGenerationModuleInfo(generationModule);

      if (identityMode === "existing") assertCreateModelWomanFromHeadContract(generationModule);
      else assertCreateModelWomanContract(generationModule);

      const mediaValues: Record<string, string> = {};
      for (const key of ["eyebrows", "lips", "hairstyle"] as const) {
        const selectedKey = mediaSelected[key];
        if (selectedKey === "custom") {
          mediaValues[key] = (customValues[key] || "").trim();
        } else {
          mediaValues[key] =
            mediaAssets[key]?.find((asset) => asset.asset_key === selectedKey)?.value?.trim() || "";
        }
      }

      const identity = buildIdentityPrompt({
        ancestryLabel: ancestry?.display_name,
        selections,
        mediaValues,
        customValues,
      });

      // The workflow contract separates body controls, scene controls and the
      // identity/head prompt. Scene defaults stay deterministic so the same
      // identity settings produce a predictable first preview.
      const occupationContext = getOccupationGenerationContext(
        selections.occupation,
        customValues.occupation,
      );
      const promptHead = commaPrompt([
        identity.prompt,
        "fitted black top",
        "frontal upper-chest beauty portrait",
        "looking directly at camera",
        "neutral-cool soft beauty lighting",
        "photorealistic",
        "realistic skin texture",
        "highly detailed eyes",
        "realistic hair strands",
        "85mm beauty photography",
        "clean white photography studio background",
      ].join(", "));

      const basePayload = {
        input_1: round1(bodyBase.ass + bodyAdjustments.ass),
        input_2: round1(bodyBase.fat + bodyAdjustments.fat),
        input_3: round1(bodyBase.breasts + bodyAdjustments.breasts),
        input_4: skinToneGenerationValue(selections.skinTone),
        input_5: round1(bodyBase.hair_length),
        input_6: round1(bodyBase.butt_elevation + bodyAdjustments.butt_elevation),
        input_7: "standing full-body confident feminine pose, natural posture",
        input_8: "standing naturally on the floor",
        input_9: "front view, full body",
        input_10: "standing and looking directly at camera",
        input_11: occupationContext.place,
        input_12: "soft flattering professional daylight, balanced neutral lighting",
        input_13: occupationContext.clothes,
        input_14: customValues.extraDetails?.trim() || null,
      };

      let payload: Record<string, unknown>;
      if (identityMode === "existing") {
        if (!existingIdentityFile) throw new Error("Confirma un rostro de identidad antes de generar.");
        const headBlob = await downloadLibraryFile(existingIdentityFile.id);
        const headFile = new File(
          [headBlob],
          existingIdentityFile.filename || "identity-head.jpg",
          { type: existingIdentityFile.content_type || headBlob.type || "image/jpeg" },
        );
        payload = { ...basePayload, input_15: headFile };
      } else {
        payload = { ...basePayload, input_15: promptHead };
      }

      // Browser diagnostics: exact contract payload immediately before the
      // existing Generation Module API sends it to the Backend.
      console.groupCollapsed(
        `%c[Create Model IA → ${generationModule.key}]`,
        "color:#ef4444;font-weight:700",
      );
      console.log("Module:", {
        id: generationModule.id,
        key: generationModule.key,
        engine: generationModule.default_execution_engine,
      });
      console.log("Occupation scene:", occupationContext);
      console.log("Head Prompt:");
      console.log(promptHead);
      console.log("Exact Generation Module inputs:");
      console.table({
        input_1: { name: "Hips Size", value: payload.input_1 },
        input_2: { name: "Fat - Thin", value: payload.input_2 },
        input_3: { name: "Breasts Size", value: payload.input_3 },
        input_4: { name: "Skin Tone", value: payload.input_4 },
        input_5: { name: "Hair Length", value: payload.input_5 },
        input_6: { name: "Butt Elevation", value: payload.input_6 },
        input_7: { name: "Pose", value: payload.input_7 },
        input_8: { name: "On", value: payload.input_8 },
        input_9: { name: "view", value: payload.input_9 },
        input_10: { name: "Action", value: payload.input_10 },
        input_11: { name: "Place", value: payload.input_11 },
        input_12: { name: "time_day_weather_or_lighting", value: payload.input_12 },
        input_13: { name: "Clothes", value: payload.input_13 },
        input_14: { name: "extra_details", value: payload.input_14 },
        input_15: { name: identityMode === "existing" ? "head" : "prompt_head", value: identityMode === "existing" ? existingIdentityFile?.filename : payload.input_15 },
      });
      console.log("Payload:", { inputs: payload });
      console.groupEnd();

      const execution = await executeGenerationModule(generationModule.id, payload);
      setGeneratedExecution(execution);
      setActiveStep(identityDoneStepIndex);
      track(execution, {
        clickable: true,
        href: `/models/${modelId}/face`,
        label: "Create Model IA",
      });

      // Persist the execution pointer immediately in the model itself. This is
      // what allows the generation screen to recover after an AppWeb or
      // Backend restart.
      try {
        const updated = await saveAiModelDraft(
          modelId,
          identityDraftSnapshot({
            selections,
            mediaSelected,
            customValues,
            completedSteps,
            activeStep: identityDoneStepIndex,
            bodyAdjustments,
            bodyBase,
            lastGenerationExecutionId: execution.id,
          }),
          displayName.trim() || model.name,
        );
        setModel(updated);
      } catch (persistError) {
        console.warn("[Create Model IA] No se pudo persistir el execution_id:", persistError);
      }

      notify.success("Modelo enviado a generación.");
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar la generación del modelo.",
      );
    } finally {
      setGeneratingModel(false);
    }
  }

  async function cancelCurrentGeneration() {
    if (!generatedExecution || !canRequestGenerationCancellation(generatedExecution) || cancellingGeneration) return;
    const executionId = generatedExecution.id;
    setCancellingGeneration(true);
    // Visual state changes immediately, while Backend remains authoritative and
    // polling continues until the provider reaches a terminal state.
    setGeneratedExecution((current) => current?.id === executionId
      ? { ...current, cancel_requested: true, provider_status: "CANCEL_REQUESTED" }
      : current);
    try {
      const updated = await cancelGenerationExecution(executionId);
      setGeneratedExecution(updated);
      track(updated, { clickable: true, href: `/models/${modelId}/face`, label: "Create Model IA" });
      notify.success(updated.status === "cancelled" ? "Generación cancelada." : "Cancelación solicitada.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "No se pudo cancelar la generación.");
      try {
        const latest = await getGenerationExecution(executionId);
        setGeneratedExecution(latest);
        track(latest, { clickable: true, href: `/models/${modelId}/face`, label: "Create Model IA" });
      } catch {
        // Backend status remains authoritative; keep the last safe local snapshot.
      }
    } finally {
      setCancellingGeneration(false);
    }
  }

  const generatedBodyImage = useMemo(
    () =>
      generatedImageForCreateModelOutput(
        generationModuleInfo,
        generatedExecution?.outputs,
        outputIdsForModule(generationModuleInfo).body,
      ),
    [generatedExecution?.outputs, generationModuleInfo],
  );
  const generatedImage = useMemo(
    () => generatedBodyImage ?? collectGeneratedImages(generatedExecution?.outputs ?? {})[0] ?? null,
    [generatedBodyImage, generatedExecution?.outputs],
  );
  const generatedIdentityFace = useMemo(
    () =>
      generatedImageForCreateModelOutput(
        generationModuleInfo,
        generatedExecution?.outputs,
        outputIdsForModule(generationModuleInfo).head,
      ),
    [generatedExecution?.outputs, generationModuleInfo],
  );
  const generatedPreviewUrl = generatedImageUrl(generatedImage);
  const generationIsActive = isGenerationActiveForUi(generatedExecution);
  const generationIsCancelling = isGenerationCancellationPending(generatedExecution);
  const generationIsBusy = isGenerationProviderPending(generatedExecution);

  const estimatedGenerationSeconds =
    generatedExecution?.estimated_duration_seconds ??
    generationModuleInfo?.pricing?.estimated_duration_seconds ??
    null;

  const elapsedGenerationSeconds = useMemo(() => {
    if (!generatedExecution) return 0;
    const startedAt = generatedExecution.started_at || generatedExecution.created_at;
    const startedMs = backendTimestampMs(startedAt);
    if (!Number.isFinite(startedMs)) return 0;
    const endMs = generatedExecution.finished_at ? backendTimestampMs(generatedExecution.finished_at) : progressClock;
    return Math.max(0, (endMs - startedMs) / 1000);
  }, [generatedExecution, progressClock]);

  const loadingDisplaySeconds = generationLoadingMode === "backend"
    ? estimatedGenerationSeconds
    : elapsedGenerationSeconds;

  const estimatedGenerationProgress = useMemo(() => {
    if (!generatedExecution) return 0;
    if (generatedExecution.status === "completed") return 100;
    if (generatedExecution.status === "failed" || generatedExecution.status === "cancelled") {
      return Math.max(0, Math.min(100, generatedExecution.progress || 0));
    }

    // While Backend still reports queued/running, neither provider progress
    // nor the visual ETA is allowed to claim completion. 100% is reserved
    // exclusively for the completed status handled above.
    const backendProgress = Math.max(0, Math.min(99, generatedExecution.progress || 0));
    if (generationLoadingMode === "backend") {
      return Math.min(99, Math.max(generatedExecution.status === "queued" ? 2 : 8, backendProgress));
    }
    if (!estimatedGenerationSeconds || estimatedGenerationSeconds <= 0) {
      return Math.min(99, Math.max(generatedExecution.status === "queued" ? 2 : 8, backendProgress));
    }

    // Optional elapsed/ETA visualization. This mode is intentionally limited
    // to generation loaders; uploads and other independent progress bars keep
    // their own real byte/task progress.
    const startedAt = generatedExecution.started_at || generatedExecution.created_at;
    const startedMs = backendTimestampMs(startedAt);
    if (!Number.isFinite(startedMs)) return Math.min(99, Math.max(2, backendProgress));

    const elapsedSeconds = Math.max(0, (progressClock - startedMs) / 1000);
    const timeProgress = Math.min(99, (elapsedSeconds / estimatedGenerationSeconds) * 100);
    return Math.min(99, Math.max(backendProgress, timeProgress));
  }, [estimatedGenerationSeconds, generatedExecution, generationLoadingMode, progressClock]);

  const estimatedTokens =
    generationModuleInfo?.pricing?.required_tokens ??
    generatedExecution?.billing_breakdown?.estimated_tokens_before_execution ??
    null;

  const billingSummary = useMemo(() => {
    if (!generatedExecution || generatedExecution.status !== "completed") return null;
    if (generatedExecution.accounting_mode === "owner_private") {
      return {
        estimated: 0,
        final: 0,
        refunded: 0,
        extra: 0,
        owner: true,
      };
    }
    const breakdown = generatedExecution.billing_breakdown ?? {};
    return {
      estimated: Number(
        breakdown.estimated_tokens_before_execution ??
        estimatedTokens ??
        generatedExecution.tokens_charged ??
        0,
      ),
      final: Number(
        breakdown.final_tokens ??
        breakdown.tokens_actually_charged ??
        generatedExecution.tokens_charged ??
        0,
      ),
      refunded: Number(breakdown.tokens_refunded ?? 0),
      extra: Number(breakdown.extra_tokens_debited ?? 0),
      owner: false,
    };
  }, [estimatedTokens, generatedExecution]);

  const generateButtonLabel = generatedExecution?.status === "completed"
    ? "Generar otra variante"
    : "Generar modelo";
  const generateTokenLabel = owner
    ? "Owner Local · sin consumo de tokens"
    : estimatedTokens != null
      ? `${estimatedTokens} tokens estimados`
      : "Calculando tokens…";

  async function useGeneratedModel() {
    if (!generatedExecution) {
      notify.error("No encontramos la generación seleccionada.");
      return;
    }
    setUsingGeneratedModel(true);
    try {
      // Relee la ejecución durable justo al confirmar. Así una variante
      // recuperada tras salir/entrar usa el mismo estado persistido que una
      // generación recién terminada y no depende del timing del catálogo UI.
      const latest = await getGenerationExecution(generatedExecution.id);
      setGeneratedExecution(latest);
      if (latest.status !== "completed" || latest.result_locked || latest.billing_access_status === "payment_pending") {
        notify.error("El resultado todavía no está disponible para usarlo.");
        return;
      }
      const latestModule = generationModuleInfo?.id === latest.module_id
        ? generationModuleInfo
        : (await listGenerationModules()).items.find((item) => item.id === latest.module_id) ?? generationModuleInfo;
      if (latestModule && latestModule !== generationModuleInfo) setGenerationModuleInfo(latestModule);
      const outputIds = outputIdsForModule(latestModule);
      const body = generatedImageForCreateModelOutput(latestModule, latest.outputs, outputIds.body);
      const head = generatedImageForCreateModelOutput(latestModule, latest.outputs, outputIds.head);
      if (!body?.storage_file_id) {
        notify.error(`La generación no contiene el cuerpo persistido (output ${outputIds.body} / output_1).`);
        return;
      }
      if (!head?.storage_file_id) {
        notify.error(`La generación no contiene el rostro persistido (output ${outputIds.head} / output_2).`);
        return;
      }
      const updated = await finalizeAiModel(
        modelId, latest.id, body.storage_file_id, outputIds.body,
        head.storage_file_id, outputIds.head,
      );
      setModel(updated);
      notify.success("Modelo guardado. Entrando a su estudio.");
      router.replace(`/models/${modelId}/studio`);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "No se pudo guardar esta variante.");
    } finally {
      setUsingGeneratedModel(false);
    }
  }

  async function applyIdentitySource(mode: IdentitySourceMode, file: ExistingIdentityFile | null) {
    const previousMode = identityMode;
    const previousFileId = existingIdentityFile?.id ?? null;
    const nextFile = mode === "existing" ? file : existingIdentityFile;
    const modeChanged = mode !== previousMode;
    const fileChanged = mode === "existing" && (nextFile?.id ?? null) !== previousFileId;
    setIdentityMode(mode);
    if (mode === "existing") setExistingIdentityFile(nextFile);
    if (fileChanged) setCompletedSteps((current) => current.filter((id) => id !== "identityFace"));
    setIdentitySourceOpen(false);
    if (modeChanged) {
      setActiveStep(0);
    } else if (mode === "existing" && fileChanged) {
      setActiveStep(EXISTING_IDENTITY_STEPS.findIndex((step) => step.id === "identityFace"));
    }
    if (model) {
      const baseDraft = model.draft_json && typeof model.draft_json === "object" ? model.draft_json : {};
      const updated = await saveAiModelDraft(modelId, { ...baseDraft, identityMode: mode, existingIdentityFile: nextFile }, displayName.trim() || model.name);
      setModel(updated);
    }
  }

  const handleAncestryChange = useCallback((asset: AncestryMediaAsset | null) => {
    setAncestry((previous) => {
      const previousKey = previous ? previous.ancestry_key || String(previous.id) : null;
      const nextKey = asset ? asset.ancestry_key || String(asset.id) : null;
      if (previousKey !== null && previousKey !== nextKey) {
        setCompletedSteps((current) =>
          current.includes("ancestry") ? current.filter((id) => id !== "ancestry") : current,
        );
      }
      return asset;
    });
  }, []);

  const identitySteps = identityMode === "existing" ? EXISTING_IDENTITY_STEPS : CREATE_IDENTITY_STEPS;
  const identityDoneStepIndex = identitySteps.findIndex((step) => step.kind === "summary");
  const currentStep = identitySteps[activeStep] ?? identitySteps[0];
  const visibleIdentitySteps = identitySteps.filter((step) => step.kind !== "summary");
  const visibleStepNumber = currentStep.kind === "summary"
    ? visibleIdentitySteps.length
    : identitySteps.slice(0, activeStep + 1).filter((step) => step.kind !== "summary").length;
  const occupationFeatured = useMemo(() => {
    const activeOccupation = pendingValues.occupation || selections.occupation;
    const promoted = activeOccupation && activeOccupation !== "custom"
      ? OCCUPATIONS.find((item) => item.id === activeOccupation)
      : undefined;
    const base = OCCUPATIONS.filter((item) => item.id !== promoted?.id);
    return promoted ? [promoted, ...base.slice(0, 14)] : base.slice(0, 15);
  }, [pendingValues.occupation, selections.occupation]);
  const occupationResults = useMemo(() => {
    const query = occupationSearch.trim().toLowerCase();
    if (!query) return OCCUPATIONS;
    return OCCUPATIONS.filter((item) =>
      item.es.toLowerCase().includes(query) ||
      item.en.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query),
    );
  }, [occupationSearch]);
  const summaryReady = identitySteps.filter(
    (step) => step.kind !== "summary" && !step.optional,
  ).every((step) => completedSteps.includes(step.id));

  function showValidation(message: string) {
    setValidationMessage(message);
    notify.error(message);
  }

  function clearValidation() {
    setValidationMessage("");
  }

  function goToStep(index: number) {
    if (index === activeStep) return;
    const target = identitySteps[index];
    if (currentStep.kind !== "summary" && !completedSteps.includes(currentStep.id)) {
      const pending = pendingFor(currentStep);
      if (pending === "custom" && !(customValues[currentStep.id] || "").trim()) {
        showValidation("Completa el campo Custom y pulsa Elegir antes de cambiar de paso.");
      } else if (pending) {
        showValidation(`Confirma tu selección de ${currentStep.label} con Elegir antes de cambiar de paso.`);
      } else if (currentStep.optional) {
        showValidation(`Confirma ${currentStep.label} con Elegir antes de cambiar de paso.`);
      } else {
        showValidation(`Debes elegir una opción en ${currentStep.label} antes de cambiar de paso.`);
      }
      return;
    }
    if (target?.id === "summary" && !summaryReady) {
      showValidation("Completa los pasos obligatorios antes de abrir el resumen.");
      return;
    }
    clearValidation();
    setActiveStep(index);
  }

  function setCustom(key: string, value: string) {
    clearValidation();
    const limit = key === "extraDetails" ? 150 : 25;
    setCustomValues((current) => ({
      ...current,
      [key]: value.slice(0, limit),
    }));
    if (completedSteps.includes(key)) {
      setCompletedSteps((current) => current.filter((id) => id !== key));
    }
  }

  function pendingFor(step: StepDefinition) {
    if (pendingValues[step.id] !== undefined) return pendingValues[step.id];
    if (step.kind === "ancestry") return ancestry ? ancestry.ancestry_key || String(ancestry.id) : "";
    if (step.kind === "media") return mediaSelected[step.id] || "";
    if (step.kind === "color") return selections[step.id] || "";
    if (step.kind === "occupation") return selections.occupation || "";
    if (step.kind === "extra") return customValues.extraDetails || "";
    if (step.kind === "identityFace") return existingIdentityFile ? String(existingIdentityFile.id) : "";
    return "";
  }


  function stepAfterCommit(stepId: StepId, completedAfter: string[]) {
    const currentIndex = identitySteps.findIndex((item) => item.id === stepId);
    const pendingIndexes = identitySteps
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.kind !== "summary" && !completedAfter.includes(item.id))
      .map(({ index }) => index);

    if (pendingIndexes.length === 0) return identityDoneStepIndex;

    const nextPending = pendingIndexes.find((index) => index > currentIndex);
    if (nextPending !== undefined) return nextPending;

    const previousPending = [...pendingIndexes]
      .reverse()
      .find((index) => index < currentIndex);

    return previousPending ?? pendingIndexes[0] ?? identityDoneStepIndex;
  }

  function commitCurrentStep(advance = true) {
    const step = currentStep;
    if (step.kind === "summary") return true;

    if (step.kind === "ancestry") {
      if (!ancestry) {
        showValidation("Elige una ascendencia en el selector superior antes de continuar.");
        return false;
      }
      clearValidation();
      const completedAfter = completedSteps.includes(step.id) ? completedSteps : [...completedSteps, step.id];
      setCompletedSteps(completedAfter);
      if (advance) setActiveStep(stepAfterCommit(step.id, completedAfter));
      return true;
    }

    if (step.kind === "identityFace") {
      if (!existingIdentityFile) {
        showValidation("Sube y confirma un rostro de identidad antes de continuar.");
        return false;
      }
      clearValidation();
      const completedAfter = completedSteps.includes(step.id) ? completedSteps : [...completedSteps, step.id];
      setCompletedSteps(completedAfter);
      if (advance) setActiveStep(stepAfterCommit(step.id, completedAfter));
      return true;
    }

    if (step.kind === "extra") {
      clearValidation();
      const value = (customValues.extraDetails || "").trim();
      setPendingValues((current) => ({ ...current, extraDetails: value }));

      const completedAfter = completedSteps.includes(step.id)
        ? completedSteps
        : [...completedSteps, step.id];

      setCompletedSteps(completedAfter);
      if (advance) setActiveStep(stepAfterCommit(step.id, completedAfter));
      return true;
    }

    const value = pendingFor(step);
    if (!value) {
      showValidation(`Debes elegir una opción en ${step.label}.`);
      return false;
    }
    if (value === "custom" && !(customValues[step.id] || "").trim()) {
      showValidation("Completa el campo Custom antes de continuar.");
      return false;
    }

    clearValidation();
    if (step.kind === "media") {
      setMediaSelected((current) => ({ ...current, [step.id]: value }));
    } else if (step.kind === "color" || step.kind === "occupation") {
      setSelections((current) => ({ ...current, [step.id]: value }));
    }

    const completedAfter = completedSteps.includes(step.id)
      ? completedSteps
      : [...completedSteps, step.id];

    setCompletedSteps(completedAfter);
    if (advance) setActiveStep(stepAfterCommit(step.id, completedAfter));
    return true;
  }

  function confirmCurrentStep() {
    commitCurrentStep(true);
  }

  function choosePending(stepId: StepId, value: string) {
    clearValidation();
    setPendingValues((current) => ({ ...current, [stepId]: value }));
    const committed = stepId === "eyebrows" || stepId === "lips" || stepId === "hairstyle"
      ? mediaSelected[stepId]
      : selections[stepId];
    if (completedSteps.includes(stepId) && committed !== value) {
      setCompletedSteps((current) => current.filter((id) => id !== stepId));
    }
  }

  function selectionLabel(step: StepDefinition) {
    if (step.kind === "media") {
      const key = mediaSelected[step.id];
      if (key === "custom") return customValues[step.id] || "Custom";
      return (
        mediaAssets[step.id]?.find((item) => item.asset_key === key)?.title ||
        "Sin elegir"
      );
    }
    if (step.kind === "color") {
      const key = selections[step.id];
      if (key === "custom") return customValues[step.id] || "Custom";
      return colorOption(step.id, key)?.label || "Sin elegir";
    }
    if (step.kind === "occupation") {
      const key = selections.occupation;
      if (key === "custom") return customValues.occupation || "Custom";
      return getOccupationLabel(key, occupationLocale) || "Sin elegir";
    }
    if (step.kind === "extra") {
      return customValues.extraDetails?.trim() || "Sin detalle";
    }
    return "";
  }

  const [displayName, setDisplayName] = useModelDisplayName(modelId, model?.name);
  if (!model)
    return (
      <div className="modelLoading pageEnter">
        <span className="spinner" />
        <p>Preparando identidad…</p>
      </div>
    );

  return (
    <div className="modelStudioViewport">
      <aside className="modelStudioStageRail">
        <ModelGlobalTimeline modelId={modelId} active="identity" bodyConfirmed={Boolean(model.body_proportion_preset_id)} />
      </aside>
      <div className="modelStudioStageContent">
        <div className="modelStudio faceStudio pageEnter">
      <div className="modelHeaderShell">
        <button
          onClick={() => router.push(`/models/${modelId}`)}
          className="modelIconBtn modelBackOutside faceBack"
        >
          <ArrowLeft size={18} />
        </button>
        <header className="modelStudioHead">
          <div className="modelHeaderRail faceHeaderRail">
            <div className="modelEditableName">
              {nameEditing ? (
                <input
                  autoFocus
                  value={displayName}
                  maxLength={40}
                  onChange={(event) => setDisplayName(event.target.value)}
                  onBlur={() => setNameEditing(false)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === "Escape") setNameEditing(false);
                  }}
                  aria-label="Nombre temporal de la modelo"
                />
              ) : (
                <button type="button" onClick={() => setNameEditing(true)} title="Editar nombre temporal">
                  <h1>{displayName}</h1>
                  <Pencil size={13} />
                </button>
              )}
            </div>
            <div className="modelSculptWidget faceStepWidget">
              <div className="modelSculptWidgetBadge">02</div>
              <div className="modelSculptWidgetCopy">
                <h2>Diseña su identidad</h2>
                <p>
                  Explora cada preview, confirma con Elegir y avanza paso a
                  paso.
                </p>
              </div>
              <button type="button" className="modelDraftSaveButton" onClick={saveDraft} disabled={draftSaving}>
                <Save size={15} /> {draftSaving ? "Guardando…" : "Guardar borrador"}
              </button>
            </div>
          </div>
        </header>
      </div>

      <div className={`faceAncestryStepTarget${currentStep?.id === "ancestry" ? " active" : ""}`}>
        <AncestryExperience modelId={modelId} value={ancestry} onChange={handleAncestryChange} />
      </div>

      <div className={`faceBuilder${generatingModel || generationIsBusy ? " faceGenerationFocus" : ""}`}>
        <div className="facePreviewRail">
          <section className="facePreviewCard">
            <div
              className={`facePreviewStage${generatedAspectRatio ? " facePreviewStageGenerated" : ""}`}
              style={generatedAspectRatio ? { aspectRatio: `${generatedAspectRatio}` } : undefined}
            >
              {generationRecoveryPending || generatingModel || generationIsBusy || generatedExecution?.status === "completed" ? (
                <ParticleMorphLoader
                  sourceImages={[
                    "/generation-loaders/model-woman/silhouette-1.webp",
                    "/generation-loaders/model-woman/silhouette-2.webp",
                    "/generation-loaders/model-woman/silhouette-3.webp",
                  ]}
                  resultUrl={generatedExecution?.status === "completed" ? generatedPreviewUrl : null}
                  active={generationIsBusy || generatingModel}
                  label="CREATE MODEL IA"
                  className="faceGenerationMorph"
                  progress={estimatedGenerationProgress}
                  estimatedSeconds={loadingDisplaySeconds}
                  secondsLabel={generationLoadingMode === "backend" ? "Tiempo Backend" : "Tiempo transcurrido"}
                  onResultAspectRatio={setGeneratedAspectRatio}
                  config={{
                    particleCount: 4500,
                    morphDurationMs: 1800,
                    holdDurationMs: 900,
                    dispersion: 34,
                    pointSize: 1.3,
                    silhouetteZoom: 1,
                    whiteThreshold: 238,
                    scanSpeed: 0.27,
                    scanWidth: 58,
                    scanIntensity: 1.5,
                  }}
                />
              ) : model.body_image_url ? (
                <ModelImage
                  src={model.body_image_url}
                  alt={`Cuerpo seleccionado de ${displayName}`}
                  className="faceBodyPreview"
                />
              ) : (
                <div className="facePreviewEmpty">
                  <Sparkles />
                  <strong>Cuerpo seleccionado</strong>
                  <span>Guarda primero el Paso 01 para continuar.</span>
                </div>
              )}
              {!generationRecoveryPending && !generatingModel && !generationIsBusy && (
                <button
                  type="button"
                  className="facePreviewHud faceBodyRefineTrigger"
                  onClick={() => {
                    setBodyDraft(bodyAdjustments);
                    setBodyRefineOpen(true);
                  }}
                >
                  <span>BODY</span>
                  <strong>Mejorar proporciones corporales</strong>
                  <ChevronRight size={16} />
                </button>
              )}
              {!generationRecoveryPending && !generatingModel && !generationIsBusy && bodyRefineOpen && (
                <div className="faceBodyRefineCard">
                  <div className="faceBodyRefineHead">
                    <div>
                      <span>AJUSTE FINO · ±0.8</span>
                      <strong>Mejorar proporciones corporales</strong>
                      <small>Los cambios son relativos al cuerpo elegido en el paso anterior y avanzan en incrementos de 0.1.</small>
                    </div>
                    <button type="button" onClick={() => setBodyRefineOpen(false)} aria-label="Cerrar">×</button>
                  </div>
                  <BodyFineTuneSlider label="Hips" internalKey="ass" base={bodyBase.ass} delta={bodyDraft.ass} onChange={(value) => setBodyDraft((current) => ({ ...current, ass: value }))} />
                  <BodyFineTuneSlider label="Fat / Thin" internalKey="fat" base={bodyBase.fat} delta={bodyDraft.fat} onChange={(value) => setBodyDraft((current) => ({ ...current, fat: value }))} />
                  <BodyFineTuneSlider label="Breasts" internalKey="breasts" base={bodyBase.breasts} delta={bodyDraft.breasts} onChange={(value) => setBodyDraft((current) => ({ ...current, breasts: value }))} />
                  <BodyFineTuneSlider label="Butt Elevation" internalKey="butt_elevation" base={bodyBase.butt_elevation} delta={bodyDraft.butt_elevation} onChange={(value) => setBodyDraft((current) => ({ ...current, butt_elevation: value }))} />
                  <button
                    type="button"
                    className="faceBodyRefineAccept"
                    onClick={() => {
                      setBodyAdjustments(bodyDraft);
                      setBodyRefineOpen(false);
                      notify.success("Proporciones corporales refinadas");
                    }}
                  >
                    <Check size={16} /> Elegir
                  </button>
                </div>
              )}
            </div>
          </section>
          {(generatingModel || generationIsActive || generationIsCancelling || cancellingGeneration) && (
            <button
              type="button"
              className="faceCancelGenerationButton"
              onClick={() => void cancelCurrentGeneration()}
              disabled={cancellingGeneration || generationIsCancelling || !canRequestGenerationCancellation(generatedExecution)}
            >
              {generationIsCancelling || cancellingGeneration ? "Cancelando…" : !generatedExecution ? "Preparando…" : "Cancelar generación"}
            </button>
          )}
        </div>

        <section className="faceControls faceWizard">
          <div className="identityModeBar">
            <div><span>MODO DE IDENTIDAD</span><strong>{identityMode === "existing" ? "Ya tengo un rostro" : "Crear identidad"}</strong></div>
            <button type="button" onClick={() => setIdentitySourceOpen(true)}>Cambiar modo</button>
          </div>
          <div className="faceControlsIntro faceControlsIntroCompact">
            <span>
              {visibleStepNumber}/{visibleIdentitySteps.length}
            </span>
          </div>

          <div className="faceStepTimeline" role="navigation" aria-label="Pasos de identidad">
            {identitySteps.map((step, index) => ({ step, index }))
              .filter(({ step }) => step.kind !== "summary")
              .map(({ step, index }) => {
                const complete = completedSteps.includes(step.id);
                return (
                  <button
                    type="button"
                    key={step.id}
                    className={`faceTimelineStep${index === activeStep ? " active" : ""}${complete ? " complete" : ""}`}
                    onClick={() => goToStep(index)}
                    title={step.label}
                  >
                    <span className="faceTimelineIcon">
                      <StepIcon id={step.id} />
                      {complete && (
                        <b className="faceTimelineDone"><Check size={9} /></b>
                      )}
                    </span>
                    <small>{step.shortLabel}</small>
                  </button>
                );
              })}
          </div>

          <div className="faceStepShell">
            <div className="faceStepContent">
              {currentStep.hint ? (
                <div className="faceStepHeading">
                  <span>{currentStep.hint}</span>
                </div>
              ) : null}

              {currentStep.kind === "ancestry" && (
                <div className="faceAncestrySelectedPreview">
                  {ancestry ? (
                    <>
                      <div className="faceAncestrySelectedMedia">
                        {ancestry.video_url ? (
                          <video key={`${ancestry.id}-${ancestry.video_url}`} src={ancestry.video_url} poster={ancestry.poster_url || undefined} muted loop playsInline autoPlay controls={false} />
                        ) : ancestry.poster_url ? (
                          <img src={ancestry.poster_url} alt="" draggable={false} />
                        ) : (
                          <div className="faceAncestrySelectedFallback">{ancestry.flag_emoji || "🌐"}</div>
                        )}
                      </div>
                      <div><span>ASCENDENCIA SELECCIONADA</span><strong>{ancestry.display_name}</strong><small>La selección de arriba, del mapa o del buscador usa este mismo valor.</small></div>
                    </>
                  ) : (
                    <div className="faceAncestrySelectedEmpty"><span>Selecciona arriba una ascendencia para ver aquí su preview.</span></div>
                  )}
                </div>
              )}

              {currentStep.kind === "media" && (() => {
                const stepId = currentStep.id as ModelGenerationToolKey;
                const pending = pendingFor(currentStep);
                return (
                  <>
                    <div className="faceMediaOptionGrid faceStepMediaGrid">
                      {mediaAssets[stepId]?.map((option) => {
                        const previewing = pending === option.asset_key;
                        return (
                          <button
                            type="button"
                            className={`faceMediaOption${previewing ? " selected previewing" : ""}`}
                            key={option.id}
                            onClick={() =>
                              choosePending(currentStep.id, option.asset_key)
                            }
                          >
                            {previewing && option.video_url ? (
                              <video
                                key={`${option.id}-${option.video_url}`}
                                src={option.video_url}
                                poster={option.poster_url || undefined}
                                muted
                                loop
                                playsInline
                                autoPlay
                                controls={false}
                                disablePictureInPicture
                                disableRemotePlayback
                                controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                                tabIndex={-1}
                                aria-hidden="true"
                              />
                            ) : option.poster_url ? (
                              <img
                                src={option.poster_url}
                                alt=""
                                draggable={false}
                                aria-hidden="true"
                              />
                            ) : (
                              <div className="faceMediaFallback">
                                {option.title}
                              </div>
                            )}
                            <span>{option.title}</span>
                            {previewing && (
                              <i>
                                <Eye size={12} />
                              </i>
                            )}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className={`faceCustomTile${pending === "custom" ? " selected" : ""}`}
                        onClick={() =>
                          choosePending(currentStep.id, "custom")
                        }
                      >
                        <b>+</b>
                        <span>Custom</span>
                      </button>
                    </div>
                    {pending === "custom" && (
                      <div className="faceCustomField faceStepCustomField">
                        <input
                          autoFocus
                          value={customValues[currentStep.id] || ""}
                          onChange={(event) =>
                            setCustom(currentStep.id, event.target.value)
                          }
                          maxLength={25}
                          placeholder="Máx. 25 caracteres"
                        />
                        <span>
                          {(customValues[currentStep.id] || "").length}/25
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}

              {currentStep.kind === "color" && (() => {
                const category = colorCategories.find(
                  (item) => item.id === currentStep.id,
                );
                if (!category) return null;
                const pending = pendingFor(currentStep);
                return (
                  <>
                    <div className="faceColorGrid faceStepColorGrid">
                      {category.options.map((option) => {
                        const previewing = pending === option.id;
                        return (
                          <button
                            type="button"
                            key={option.id}
                            className={`faceColorOption${previewing ? " selected previewing" : ""}`}
                            onClick={() =>
                              choosePending(currentStep.id, option.id)
                            }
                          >
                            <span
                              className="faceColorSwatch"
                              style={{ background: option.tone }}
                            />
                            <b>{option.label}</b>
                            {previewing && (
                              <i>
                                <Eye size={12} />
                              </i>
                            )}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className={`faceColorOption faceColorCustom${pending === "custom" ? " selected" : ""}`}
                        onClick={() =>
                          choosePending(currentStep.id, "custom")
                        }
                      >
                        <span className="faceColorSwatch custom">+</span>
                        <b>Custom</b>
                      </button>
                    </div>
                    {pending === "custom" && (
                      <div className="faceCustomField faceStepCustomField">
                        <input
                          autoFocus
                          value={customValues[currentStep.id] || ""}
                          onChange={(event) =>
                            setCustom(currentStep.id, event.target.value)
                          }
                          maxLength={25}
                          placeholder="Máx. 25 caracteres"
                        />
                        <span>
                          {(customValues[currentStep.id] || "").length}/25
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}

              {currentStep.kind === "occupation" && (() => {
                const pending = pendingFor(currentStep);
                return (
                  <>
                    <div className="faceOccupationGrid">
                      {occupationFeatured.map((occupation) => (
                        <button
                          type="button"
                          key={occupation.id}
                          className={`faceOccupationTile${pending === occupation.id ? " selected" : ""}`}
                          onClick={() => choosePending("occupation", occupation.id)}
                        >
                          <b>{getOccupationLabel(occupation.id, occupationLocale)}</b>
                          <small>{occupation.en}</small>
                        </button>
                      ))}
                      <button
                        type="button"
                        className="faceOccupationTile more"
                        onClick={() => {
                          setOccupationSearch("");
                          setOccupationModalOpen(true);
                        }}
                      >
                        <b>More</b>
                        <small>100+ ocupaciones</small>
                      </button>
                      <button
                        type="button"
                        className={`faceOccupationTile custom${pending === "custom" ? " selected" : ""}`}
                        onClick={() => choosePending("occupation", "custom")}
                      >
                        <b>Custom</b>
                        <small>Otra ocupación</small>
                      </button>
                    </div>

                    {pending === "custom" && (
                      <div className="faceCustomField faceStepCustomField">
                        <input
                          autoFocus
                          value={customValues.occupation || ""}
                          onChange={(event) => setCustom("occupation", event.target.value)}
                          maxLength={25}
                          placeholder="Máx. 25 caracteres"
                        />
                        <span>{(customValues.occupation || "").length}/25</span>
                      </div>
                    )}

                    {occupationModalOpen && (
                      <div
                        className="faceOccupationModalBackdrop"
                        role="presentation"
                        onMouseDown={(event) => {
                          if (event.currentTarget === event.target) setOccupationModalOpen(false);
                        }}
                      >
                        <section className="faceOccupationModal" role="dialog" aria-modal="true" aria-label="Buscar ocupación">
                          <header>
                            <div>
                              <span>OCUPACIÓN</span>
                              <h3>Busca tu ocupación</h3>
                              <p>Catálogo bilingüe preparado para español e inglés.</p>
                            </div>
                            <button type="button" aria-label="Cerrar" onClick={() => setOccupationModalOpen(false)}>×</button>
                          </header>
                          <div className="faceOccupationSearch">
                            <input
                              autoFocus
                              value={occupationSearch}
                              onChange={(event) => setOccupationSearch(event.target.value)}
                              placeholder="Buscar en español o inglés..."
                            />
                          </div>
                          <div className="faceOccupationModalList">
                            {occupationResults.map((occupation) => (
                              <button
                                type="button"
                                key={occupation.id}
                                className={pending === occupation.id ? "selected" : ""}
                                onClick={() => {
                                  choosePending("occupation", occupation.id);
                                  setOccupationModalOpen(false);
                                }}
                              >
                                <span>
                                  <b>{occupation.es}</b>
                                  <small>{occupation.en}</small>
                                </span>
                                {pending === occupation.id && <Check size={16} />}
                              </button>
                            ))}
                            {occupationResults.length === 0 && (
                              <div className="faceOccupationEmpty">
                                <strong>No encontramos esa ocupación.</strong>
                                <span>Puedes cerrar y usar Custom.</span>
                              </div>
                            )}
                          </div>
                        </section>
                      </div>
                    )}
                  </>
                );
              })()}

              {currentStep.kind === "extra" && (
                <div className="faceExtraStep">
                  <div className="faceExtraDetails">
                    <textarea
                      autoFocus
                      rows={4}
                      value={customValues.extraDetails || ""}
                      onChange={(event) =>
                        setCustom("extraDetails", event.target.value)
                      }
                      maxLength={150}
                      placeholder="Ej. freckles, beauty mark, soft dimples..."
                    />
                    <span>
                      {(customValues.extraDetails || "").length}/150
                    </span>
                  </div>
                  <p>
                    Este paso es opcional. Puedes escribir un detalle o
                    continuar sin agregar ninguno.
                  </p>
                </div>
              )}


              {currentStep.kind === "identityFace" && (
                <div className="faceIdentityUploadStep">
                  <div className="existingIdentityHero">
                    {existingIdentityFile ? <img src={existingIdentityFile.url} alt="Rostro de identidad seleccionado" /> : <div className="existingIdentityMissing">Sin rostro seleccionado</div>}
                    <div>
                      <div className="existingIdentityWarning">
                        <TriangleAlert size={18} aria-hidden="true" />
                        <p>Usa únicamente un rostro propio o una imagen para la que tengas consentimiento y derechos suficientes. No subas la identidad de otra persona sin autorización.</p>
                      </div>
                      <button type="button" onClick={() => setIdentitySourceOpen(true)}>{existingIdentityFile ? "Elegir otro rostro" : "Cargar rostro"}</button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep.kind === "summary" && (
                <div className="faceSummary faceSummaryMinimal">
                  <div className="faceSummaryHero">
                    <span className="faceSummaryDoneIcon">
                      <Check size={54} strokeWidth={2.5} />
                    </span>
                    <div>
                      <span>STEP DONE</span>
                      <h3>{identityMode === "existing" ? "Tu rostro de identidad está listo" : "Tu identidad está lista"}</h3>
                      <p>
                        Todos los pasos fueron confirmados. Ya puedes generar tu modelo.
                      </p>
                    </div>
                  </div>

                  {generationIsBusy ? (
                    <button className="faceGenerateModelButton faceGenerateModelButtonDone" type="button" disabled>
                      <WandSparkles size={19} />
                      {generationIsCancelling ? "Cancelando generación…" : "Generando modelo…"}
                    </button>
                  ) : generatedExecution?.status === "completed" && generatedImage ? (
                    <div className="faceGeneratedActions">
                      <button
                        className="faceGenerateModelButton faceGenerateRetryButton"
                        type="button"
                        onClick={() => void generateModel()}
                        disabled={generatingModel}
                      >
                        <WandSparkles size={19} />
                        <span>
                          <strong>{generatingModel ? "Enviando…" : generateButtonLabel}</strong>
                          {!generatingModel && <small>{generateTokenLabel}</small>}
                        </span>
                      </button>
                      <button
                        className="faceGenerateModelButton faceGenerateModelButtonDone faceUseGeneratedButton"
                        type="button"
                        onClick={() => void useGeneratedModel()}
                        disabled={usingGeneratedModel}
                      >
                        <Check size={19} />
                        {usingGeneratedModel ? "Guardando modelo…" : "Usar esta"}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="faceGenerateModelButton faceGenerateModelButtonDone"
                      type="button"
                      onClick={() => void generateModel()}
                      disabled={generatingModel}
                    >
                      <WandSparkles size={19} />
                      <span>
                        <strong>{generatingModel ? "Enviando generación…" : generateButtonLabel}</strong>
                        {!generatingModel && <small>{generateTokenLabel}</small>}
                      </span>
                    </button>
                  )}

                  {billingSummary && (
                    <div className="faceGenerationBillingSummary">
                      {billingSummary.owner ? (
                        <span>Cuenta Owner · esta generación no produjo movimientos de tokens.</span>
                      ) : (
                        <>
                          <span>Estimado: <b>{billingSummary.estimated}</b> tokens</span>
                          <span>Usados: <b>{billingSummary.final}</b> tokens</span>
                          {billingSummary.refunded > 0 ? (
                            <span>Ajuste: se devolvieron <b>{billingSummary.refunded}</b> tokens</span>
                          ) : billingSummary.extra > 0 ? (
                            <span>Ajuste: se cobraron <b>{billingSummary.extra}</b> tokens adicionales</span>
                          ) : (
                            <span>Ajuste: <b>sin cambios</b></span>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {generatedExecution?.status === "failed" && (
                    <p style={{ color: "#fca5a5", fontSize: 12 }}>
                      {generatedExecution.error || "La generación falló. Puedes volver a intentarlo."}
                    </p>
                  )}
                </div>
              )}

              {validationMessage && currentStep.kind !== "summary" && (
                <div className="faceStepValidation" role="alert" aria-live="polite">
                  <span>!</span>
                  <p>{validationMessage}</p>
                </div>
              )}

              {currentStep.kind !== "summary" && (
                <div className="faceStepConfirmRow">
                  <button
                    type="button"
                    className="faceChooseButton"
                    onClick={confirmCurrentStep}
                  >
                    <Check size={17} />
                    {currentStep.optional &&
                    !(customValues.extraDetails || "").trim()
                      ? "Continuar sin detalle"
                      : "Elegir"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
      <IdentitySourceModal
        open={identitySourceOpen}
        initialMode={identityMode}
        existingFile={existingIdentityFile}
        onClose={() => setIdentitySourceOpen(false)}
        onConfirm={applyIdentitySource}
      />
      </div>
    </div>
  </div>
  );
}



function BodyFineTuneSlider({ label, internalKey, base, delta, onChange }: { label: string; internalKey: "ass" | "fat" | "breasts" | "butt_elevation"; base: number; delta: number; onChange: (value: number) => void }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const index = BODY_FINE_VALUES.findIndex((value) => Math.abs(value - delta) < 0.0001);
  const safeIndex = index >= 0 ? index : 8;
  const percent = (safeIndex / (BODY_FINE_VALUES.length - 1)) * 100;
  const finalValue = round1(base + delta);

  const updateFromClientX = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(rect.width, 1)));
    const nextIndex = Math.round(ratio * (BODY_FINE_VALUES.length - 1));
    onChange(BODY_FINE_VALUES[nextIndex] ?? 0);
  };
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) updateFromClientX(event.clientX);
  };
  const stopDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let nextIndex = safeIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") nextIndex = Math.min(BODY_FINE_VALUES.length - 1, safeIndex + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") nextIndex = Math.max(0, safeIndex - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = BODY_FINE_VALUES.length - 1;
    else return;
    event.preventDefault();
    onChange(BODY_FINE_VALUES[nextIndex] ?? 0);
  };

  return (
    <div className="modelAxis faceBodyFineAxis">
      <div>
        <label>{label}</label>
        <span className="faceBodyFineValues">Base {signed(base)} · Ajuste {signed(delta)} · Final <b>{signed(finalValue)}</b></span>
      </div>
      <div
        ref={trackRef}
        className="modelDiscreteSlider"
        role="slider"
        tabIndex={0}
        aria-label={`${label} adjustment`}
        aria-valuemin={-0.8}
        aria-valuemax={0.8}
        aria-valuenow={delta}
        data-internal-key={internalKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onKeyDown={onKeyDown}
      >
        <div className="modelDiscreteRail" />
        <div className="modelDiscreteFill" style={{ width: `${percent}%` }} />
        {BODY_FINE_VALUES.map((value, tickIndex) => (
          <span key={`${internalKey}-${value}`} className={`modelDiscreteTick${tickIndex === safeIndex ? " active" : ""}`} style={{ left: `${(tickIndex / (BODY_FINE_VALUES.length - 1)) * 100}%` }} />
        ))}
        <span className="modelDiscreteThumb" style={{ left: `${percent}%` }} />
      </div>
      <div className="modelAxisEnds"><span>-0.8</span><span>0</span><span>+0.8</span></div>
    </div>
  );
}
