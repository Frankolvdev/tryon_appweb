"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Check,
  Eye,
  Sparkles,
  WandSparkles,
  Save,
  TriangleAlert,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { useModelDisplayName } from "@/lib/use-model-display-name";
import { finalizeAiModel, getAiModel, listBodyVariants, listBubbleButtVariants, saveAiModelDraft } from "@/lib/ai-model-api";
import { cancelGenerationExecution, executeCreateModelWithPrivateFaceReference, executeGenerationModule, getGenerationExecution, getGenerationLoadingProgressMode, listGenerationModules, type GenerationLoadingProgressMode } from "@/lib/generation-api";
import { resolveCreateModelGenerationModule, tryResolveCreateModelGenerationModule } from "@/lib/create-model-generation-module-router";
import { canRequestGenerationCancellation, isGenerationActiveForUi, isGenerationCancellationPending, isGenerationFinalizing, isGenerationProviderPending, shouldPollGenerationExecution, isGenerationExecutionPollable } from "@/lib/generation-execution-contract";
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
import { BodyProportionsStep, preloadBodyProportionsStep } from "./body-proportions-step";
import { AncestryExperience } from "./ancestry-experience";
import { useRouter, useSearchParams } from "next/navigation";
import { IdentitySourceModal, type ExistingIdentityFile, type IdentitySourceMode } from "./identity-source-modal";
import { downloadLibraryFile } from "@/lib/user-library-api";

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
  | "bodyProportions"
  | "ancestry"
  | "age"
  | "eyeColor"
  | "eyebrows"
  | "lips"
  | "skinTone"
  | "hairstyle"
  | "hairLength"
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
  kind: "body" | "intro" | "ancestry" | "age" | "color" | "media" | "range" | "occupation" | "extra" | "identityFace" | "summary";
  optional?: boolean;
};

const CREATE_IDENTITY_STEPS: StepDefinition[] = [
  {
    id: "bodyProportions",
    label: "Proporciones corporales",
    shortLabel: "Proporciones",
    hint: "Define las proporciones corporales de tu modelo",
    kind: "body",
  },
  {
    id: "ancestry",
    label: "Ascendencia",
    shortLabel: "Ascendencia",
    hint: "Elige arriba la ascendencia de tu modelo",
    kind: "ancestry",
  },
  {
    id: "age",
    label: "Edad",
    shortLabel: "Edad",
    hint: "Elige la edad de tu modelo",
    kind: "age",
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
    id: "hairLength",
    label: "Hair Length",
    shortLabel: "Largo",
    hint: "Ajusta el largo del cabello",
    kind: "range",
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
    id: "bodyProportions",
    label: "Proporciones corporales",
    shortLabel: "Proporciones",
    hint: "Define las proporciones corporales de tu modelo",
    kind: "body",
  },
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
      src={id === "bodyProportions" ? "/model-stage-icons/body.svg" : id === "hairLength" ? "/identity-icons/hairstyle.svg" : id === "age" ? "/identity-icons/age.svg" : `/identity-icons/${id}.svg`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

function round1(value: number) { return Math.round((value + Number.EPSILON) * 10) / 10; }
function generationSeed() {
  const minimum = 100_000_000_000_000;
  const range = 900_000_000_000_000;
  const sourceRange = 2 ** 52;
  const acceptanceLimit = Math.floor(sourceRange / range) * range;
  const words = new Uint32Array(2);
  let candidate = acceptanceLimit;
  while (candidate >= acceptanceLimit) {
    crypto.getRandomValues(words);
    candidate = (words[0] * 2 ** 20) + (words[1] & 0xFFFFF);
  }
  return minimum + (candidate % range);
}
const HIP_GENERATION_VALUES = ["small hips", "medium hips", "big hips", "huge hips"] as const;

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
function normalizeBodyDelta(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return round1(Math.min(0.8, Math.max(-0.8, Math.round(number * 10) / 10)));
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

function outputIdsForModule(module: GenerationModule | null) {
  if (!module) return null;
  const body = module.outputs.find((item) => item.key === "output_1");
  const head = module.outputs.find((item) => item.key === "output_2");
  if (!body || !head) return null;
  return { body: body.id, head: head.id };
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
  // Recovery-safe fallback by the live module binding. The numeric database ID
  // is intentionally not frozen because output rows can be recreated/versioned.
  const outputDefinition = module?.outputs.find((item) => item.id === outputId);
  const fallbackKey = outputDefinition?.key === "output_1" || outputDefinition?.key === "output_2"
    ? outputDefinition.key
    : null;
  return fallbackKey && outputs ? collectGeneratedImages(outputs[fallbackKey] ?? {})[0] ?? null : null;
}


function identityDraftSnapshot({
  selections,
  mediaSelected,
  customValues,
  hairLengthTouched,
  completedSteps,
  activeStep,
  bodyAdjustments,
  bodyBase,
  lastGenerationExecutionId,
}: {
  selections: IdentitySelections;
  mediaSelected: Record<string, string>;
  customValues: Record<string, string>;
  hairLengthTouched: boolean;
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
    identityControlMeta: { hairLengthTouched },
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

function FaceDiscreteSlider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const percent = ((value - min) / Math.max(max - min, step)) * 100;
  const snapPoints = useMemo(() => {
    const out: number[] = [];
    for (let point = min; point <= max + 1e-9; point += step) {
      out.push(Number(point.toFixed(4)));
    }
    if (Math.abs((out[out.length - 1] ?? min) - max) > 1e-6) out.push(max);
    return out;
  }, [min, max, step]);

  const update = (clientX: number) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(rect.width, 1)));
    const raw = min + ratio * (max - min);
    let next = snapPoints[0] ?? min;
    for (const point of snapPoints) {
      if (Math.abs(point - raw) < Math.abs(next - raw)) next = point;
    }
    onChange(Number(next.toFixed(4)));
  };

  return (
    <div
      ref={ref}
      className="modelDiscreteSlider"
      role="slider"
      tabIndex={0}
      aria-label="Hair Length"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging.current) update(event.clientX);
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
    >
      <div className="modelDiscreteRail" />
      <div className="modelDiscreteFill" style={{ width: `${percent}%` }} />
      <span className="modelDiscreteThumb" style={{ left: `${percent}%` }} />
    </div>
  );
}

export function FaceStudio({ modelId }: { modelId: number }) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingFinalModel = searchParams.get("edit") === "1";
  const { track, subscribe } = useGenerationJobs();
  const { user } = useAppSession();
  const owner = isOwnerAccount(user);
  const generationRecoveryRetryRef = useRef<number | null>(null);
  const generationRecoveryMountedRef = useRef(true);
  const generationFocusPreviewRef = useRef<HTMLDivElement | null>(null);
  const generationVisualClockRef = useRef<{ id: string; startedAtMs: number } | null>(null);
  const generationAncestryCollapseAnchorTopRef = useRef<number | null>(null);
  const [generationAncestryCollapsed, setGenerationAncestryCollapsed] = useState(false);
  const [generationModuleInfo, setGenerationModuleInfo] = useState<GenerationModule | null>(null);
  const [generationLoadingProgressMode, setGenerationLoadingProgressMode] = useState<GenerationLoadingProgressMode | null>(null);
  const [progressClock, setProgressClock] = useState(() => Date.now());
  const [generationRecoveryPending, setGenerationRecoveryPending] = useState(true);
  const [generatedAspectRatio, setGeneratedAspectRatio] = useState<number | null>(null);
  const [model, setModel] = useState<AiModelProfile | null>(null);
  const [ancestry, setAncestry] = useState<AncestryMediaAsset | null>(null);
  const [generatingModel, setGeneratingModel] = useState(false);
  const [generatedExecution, setGeneratedExecution] = useState<GenerationExecution | null>(null);
  const [restoredExecution, setRestoredExecution] = useState(false);
  const [restoredResultReady, setRestoredResultReady] = useState(false);
  const generationIsBusy = isGenerationProviderPending(generatedExecution);
  const [usingGeneratedModel, setUsingGeneratedModel] = useState(false);
  const [editingGeneratedResult, setEditingGeneratedResult] = useState(editingFinalModel);
   const [selections, setSelections] =
    useState<IdentitySelections>(defaultIdentitySelections);
  const [mediaAssets, setMediaAssets] = useState<
    Record<string, ModelGenerationAsset[]>
  >({ eyebrows: [], lips: [], hairstyle: [] });
  const [mediaSelected, setMediaSelected] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [hairLengthTouched, setHairLengthTouched] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState("");
  const [occupationModalOpen, setOccupationModalOpen] = useState(false);
  const [occupationSearch, setOccupationSearch] = useState("");
  const [occupationLocale] = useState<OccupationLocale>("es");
  const [bodyBase, setBodyBase] = useState({ ass: 0, fat: 0, breasts: 0, skin_tone: 0, hair_length: 0, butt_elevation: 0 });
  const [bodyAdjustments, setBodyAdjustments] = useState({ ass: 0, fat: 0, breasts: 0, butt_elevation: 0 });
  const [draftSaving, setDraftSaving] = useState(false);
  const [bodyProportionsDraft, setBodyProportionsDraft] = useState<Record<string, unknown> | null>(null);
  const [bodyModeDraft, setBodyModeDraft] = useState<"fit" | "curvy" | null>(null);
  const [bodyProportionsMetaDraft, setBodyProportionsMetaDraft] = useState<{ heightTouched: boolean; hipsTouched: boolean; breastsTouched: boolean } | null>(null);
  const [identityMode, setIdentityMode] = useState<IdentitySourceMode>("create");
  const [existingIdentityFile, setExistingIdentityFile] = useState<ExistingIdentityFile | null>(null);
  const [identitySourceOpen, setIdentitySourceOpen] = useState(false);
  const [cancellingGeneration, setCancellingGeneration] = useState(false);

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
    getGenerationLoadingProgressMode()
      .then((mode) => { if (alive) setGenerationLoadingProgressMode(mode); })
      .catch(() => { if (alive) setGenerationLoadingProgressMode("elapsed_estimate"); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    listGenerationModules()
      .then((response) => {
        if (!alive) return;
        setGenerationModuleInfo(
          tryResolveCreateModelGenerationModule(response.items, {
            isOwner: owner,
            identityMode,
          }),
        );
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [identityMode, owner]);

  useEffect(() => {
    let cancelled = false;
    getAiModel(modelId)
      .then((result) => {
        if (cancelled) return;
        if (result.stage === "studio" && !editingFinalModel) {
          router.replace(`/models/${modelId}/studio`);
          return;
        }
        setModel(result);
        const preloadDraft = result.draft_json && typeof result.draft_json === "object"
          ? (result.draft_json as Record<string, any>).bodyProportions
          : null;
        preloadBodyProportionsStep(preloadDraft && typeof preloadDraft === "object" ? preloadDraft : null);
        try {
          const saved = localStorage.getItem(`${STORAGE_PREFIX}${modelId}`);
          const data = result.draft_json && Object.keys(result.draft_json).length ? result.draft_json : (saved ? JSON.parse(saved) : null);
          if (data) {
            setSelections({
              ...defaultIdentitySelections,
              ...(data.selections || {}),
            });
            setMediaSelected(data.mediaSelected || {});
            const savedHairLengthTouched = data?.identityControlMeta?.hairLengthTouched === true;
            const restoredCustomValues = { ...(data.customValues || {}) };
            if (!savedHairLengthTouched) restoredCustomValues.hairLength = "0";
            setHairLengthTouched(savedHairLengthTouched);
            setCustomValues(restoredCustomValues);
            const modelSetup = data.modelSetup && typeof data.modelSetup === "object" ? data.modelSetup : null;
            const restoredIdentityMode: IdentitySourceMode =
              data.identityMode === "existing" || modelSetup?.identityMode === "existing" ? "existing" : "create";
            const restoredExistingIdentityFile = data.existingIdentityFile || modelSetup?.existingIdentityFile || null;
            setIdentityMode(restoredIdentityMode);
            setExistingIdentityFile(restoredExistingIdentityFile);
            if (data.ancestry && typeof data.ancestry === "object") {
              const savedAncestry = data.ancestry as Partial<AncestryMediaAsset>;
              if (
                typeof savedAncestry.id === "number" &&
                typeof savedAncestry.ancestry_key === "string" &&
                typeof savedAncestry.display_name === "string"
              ) {
                setAncestry({
                  id: savedAncestry.id,
                  ancestry_key: savedAncestry.ancestry_key,
                  display_name: savedAncestry.display_name,
                  country_code: typeof savedAncestry.country_code === "string" ? savedAncestry.country_code : null,
                  flag_emoji: typeof savedAncestry.flag_emoji === "string" ? savedAncestry.flag_emoji : null,
                  latitude: typeof savedAncestry.latitude === "number" ? savedAncestry.latitude : null,
                  longitude: typeof savedAncestry.longitude === "number" ? savedAncestry.longitude : null,
                  sort_order: typeof savedAncestry.sort_order === "number" ? savedAncestry.sort_order : 0,
                  storage_mode: typeof savedAncestry.storage_mode === "string" ? savedAncestry.storage_mode : "draft",
                  poster_url: typeof savedAncestry.poster_url === "string" ? savedAncestry.poster_url : null,
                  video_url: typeof savedAncestry.video_url === "string" ? savedAncestry.video_url : null,
                  is_active: savedAncestry.is_active !== false,
                  metadata: savedAncestry.metadata && typeof savedAncestry.metadata === "object" ? savedAncestry.metadata : {},
                });
              }
            }
            if (data.bodyProportions && typeof data.bodyProportions === "object") setBodyProportionsDraft(data.bodyProportions);
            if (data.bodyProportionsMeta && typeof data.bodyProportionsMeta === "object") {
              setBodyProportionsMetaDraft({ heightTouched: data.bodyProportionsMeta.heightTouched === true, hipsTouched: data.bodyProportionsMeta.hipsTouched === true, breastsTouched: data.bodyProportionsMeta.breastsTouched === true });
            } else {
              setBodyProportionsMetaDraft({ heightTouched: false, hipsTouched: false, breastsTouched: false });
            }
            if (data.bodyMode === "fit" || data.bodyMode === "curvy") setBodyModeDraft(data.bodyMode);
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
            }
            const restoredMode: IdentitySourceMode = restoredIdentityMode;
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
                  if (cancelled || !generationRecoveryMountedRef.current) return;
                  setRestoredExecution(true);
                  setRestoredResultReady(false);
                  setGeneratedExecution(execution);
                  setActiveStep((restoredMode === "existing" ? EXISTING_IDENTITY_STEPS : CREATE_IDENTITY_STEPS).findIndex((step) => step.kind === "summary"));
                  track(execution, {
                    clickable: true,
                    href: editingFinalModel ? `/models/${modelId}/face?edit=1` : `/models/${modelId}/face`,
                    label: "Create Model IA",
                  });
                  setGenerationRecoveryPending(false);
                  generationRecoveryRetryRef.current = null;
                } catch {
                  if (cancelled || !generationRecoveryMountedRef.current) return;
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
        if (cancelled) return;
        setGenerationRecoveryPending(false);
        notify.error(
          error instanceof Error
            ? error.message
            : "No se pudo abrir el estudio de rostro",
        );
      });

    // Identity previews are auxiliary UI. Load the three tool catalogs in one
    // request so returning to an active execution is not competing with three
    // independent HTTP/DB/storage-signing requests. A preview failure must not
    // block generation recovery or surface a misleading global studio error.
    listModelGenerationAssets(MEDIA_TOOLS.map((tool) => tool.id))
      .then((result) => {
        if (cancelled) return;
        const grouped: Record<string, ModelGenerationAsset[]> = { eyebrows: [], lips: [], hairstyle: [] };
        for (const item of result.items) {
          if (item.tool_key in grouped) grouped[item.tool_key].push(item);
        }
        setMediaAssets(grouped);
      })
      .catch(() => {
        // Keep the current empty catalogs. These previews are lazy/optional and
        // can be retried on the next mount without delaying a recovered result.
      });

    return () => {
      cancelled = true;
      if (generationRecoveryRetryRef.current !== null) {
        window.clearTimeout(generationRecoveryRetryRef.current);
        generationRecoveryRetryRef.current = null;
      }
    };
  }, [editingFinalModel, modelId, router, track]);

  useEffect(() => {
    // The current Create/From Head contracts (8/9) persist body controls directly
    // in draft_json.bodyProportions. They must never pay the legacy body-variant
    // lookup cost. Keep this catalog reconstruction only as a compatibility
    // fallback for historical generation contracts that still consume bodyBase.
    if (!generationModuleInfo || generationModuleInfo.id === 8 || generationModuleInfo.id === 9) return;
    if (!model?.body_proportion_preset_id) return;
    let alive = true;
    Promise.all([
      listBodyVariants(model.sex),
      listBubbleButtVariants(model.body_proportion_preset_id),
    ])
      .then(([catalog, bubbles]) => {
        if (!alive) return;
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
      .catch(() => {
        // Historical compatibility only. The new template does not depend on
        // these presets and therefore never surfaces the legacy refinement error.
      });
    return () => { alive = false; };
  }, [generationModuleInfo?.id, model?.body_proportion_preset_id, model?.bubble_butt_preset_id, model?.bubble_butt_variant_index, model?.sex]);

  useEffect(() => {
    if (!isGenerationProviderPending(generatedExecution)) return;
    setProgressClock(Date.now());
    const timer = window.setInterval(() => setProgressClock(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [generatedExecution?.id, generatedExecution?.status]);

useEffect(() => {
  const executionId = generatedExecution?.id;
  if (!executionId) return;
  let cancelled = false;

  const apply = (latest: GenerationExecution) => {
    if (cancelled || latest.id !== executionId) return;
    setGeneratedExecution(latest);
    if (latest.status === "failed") {
      notify.error(latest.error || "La generación del modelo falló.");
    }
  };

  // Close the tiny race between the POST response and attaching the realtime
  // listener. This is one read per execution, not a polling loop.
  void getGenerationExecution(executionId).then(apply).catch(() => {});
  const unsubscribe = subscribe(apply);
  return () => {
    cancelled = true;
    unsubscribe();
  };
}, [generatedExecution?.id, subscribe]);

  useEffect(() => {
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${modelId}`,
        JSON.stringify({
          selections,
          mediaSelected,
          customValues,
          identityControlMeta: { hairLengthTouched },
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
    hairLengthTouched,
    completedSteps,
    activeStep,
    bodyAdjustments,
    bodyBase,
    identityMode,
    existingIdentityFile,
    generatedExecution?.id,
  ]);

  // Generation focus R5: ancestry still exits upward, but its layout collapse is
  // delayed until the visual exit has finished. We then compensate scroll in a
  // layout effect so the scanner keeps the same viewport Y and only appears to
  // float horizontally toward center.
  useEffect(() => {
    const focusActive = generationRecoveryPending || generatingModel || generationIsBusy || (!editingGeneratedResult && generatedExecution?.status === "completed");
    if (!focusActive) {
      setGenerationAncestryCollapsed(false);
      generationAncestryCollapseAnchorTopRef.current = null;
      return;
    }

    const collapse = () => {
      generationAncestryCollapseAnchorTopRef.current =
        generationFocusPreviewRef.current?.getBoundingClientRect().top ?? null;
      setGenerationAncestryCollapsed(true);
    };

    // Explicit Generate gets the full upward exit. Recovery should settle without
    // replaying a long entrance choreography after navigation/reload.
    if (generatingModel) {
      const timer = window.setTimeout(collapse, prefersReducedMotion ? 80 : 300);
      return () => window.clearTimeout(timer);
    }

    collapse();
    return undefined;
  }, [generationRecoveryPending, generatingModel, generationIsBusy, generatedExecution?.status, editingGeneratedResult, prefersReducedMotion]);

  useLayoutEffect(() => {
    if (!generationAncestryCollapsed) return;
    const beforeTop = generationAncestryCollapseAnchorTopRef.current;
    const rail = generationFocusPreviewRef.current;
    if (beforeTop == null || !rail) return;

    const afterTop = rail.getBoundingClientRect().top;
    const delta = afterTop - beforeTop;
    if (Math.abs(delta) > 0.5) {
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });
    }
    generationAncestryCollapseAnchorTopRef.current = null;
  }, [generationAncestryCollapsed]);

  async function saveDraft() {
    setDraftSaving(true);
    const draft = {
      ...identityDraftSnapshot({
      selections,
      mediaSelected,
      customValues,
      hairLengthTouched,
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
      const latestModel = await getAiModel(modelId);
      const baseDraft = latestModel.draft_json && typeof latestModel.draft_json === "object" ? latestModel.draft_json : {};
      const updated = await saveAiModelDraft(modelId, {
        ...baseDraft,
        ...draft,
        ...(bodyProportionsDraft ? { bodyProportions: bodyProportionsDraft } : {}),
        ...(bodyProportionsMetaDraft ? { bodyProportionsMeta: bodyProportionsMetaDraft } : {}),
        ...(bodyModeDraft ? { bodyMode: bodyModeDraft } : {}),
        ...(ancestry ? {
          ancestry: {
            id: ancestry.id,
            ancestry_key: ancestry.ancestry_key,
            display_name: ancestry.display_name,
            country_code: ancestry.country_code,
            flag_emoji: ancestry.flag_emoji,
            latitude: ancestry.latitude,
            longitude: ancestry.longitude,
            sort_order: ancestry.sort_order,
            storage_mode: ancestry.storage_mode,
            poster_url: ancestry.poster_url,
            video_url: ancestry.video_url,
            is_active: ancestry.is_active,
            metadata: ancestry.metadata,
          },
        } : {}),
      }, displayName.trim() || model?.name);
      setModel(updated);
      notify.success("Borrador guardado");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "No se pudo guardar el borrador");
    } finally { setDraftSaving(false); }
  }

  async function generateModel() {
    // queued/running remains exclusive even while cancellation is pending.
    // Do not allow a second execution until Backend reaches a terminal state.
    if (!model || generationRecoveryPending || generatingModel || isGenerationProviderPending(generatedExecution)) return;
    if (!summaryReady) {
      showValidation("Completa los pasos obligatorios antes de generar el modelo.");
      return;
    }
    if (!ancestry) {
      showValidation("Elige una ascendencia antes de generar el modelo.");
      notify.error("La ascendencia es obligatoria para generar.");
      return;
    }

    setEditingGeneratedResult(false);
    setRestoredExecution(false);
    setRestoredResultReady(false);
    setGeneratingModel(true);
    setGeneratedAspectRatio(null);

    // Generation focus R5 is coordinated by the focus effects above: ancestry
    // exits upward first, then its space collapses without moving the scanner
    // vertically in the viewport.

    try {
      // Generar siempre guarda primero el mismo progreso que el botón
      // "Guardar borrador", pero sin un toast intermedio.
      const latestBeforeGeneration = await getAiModel(modelId);
      const baseDraftBeforeGeneration = latestBeforeGeneration.draft_json && typeof latestBeforeGeneration.draft_json === "object" ? latestBeforeGeneration.draft_json : {};
      const savedBeforeGeneration = await saveAiModelDraft(
        modelId,
        {
          ...baseDraftBeforeGeneration,
          ...identityDraftSnapshot({
            selections,
            mediaSelected,
            customValues,
            hairLengthTouched,
            completedSteps,
            activeStep: identityDoneStepIndex,
            bodyAdjustments,
            bodyBase,
            lastGenerationExecutionId: generatedExecution?.id,
          }),
          identityMode,
          existingIdentityFile,
          ...(bodyProportionsDraft ? { bodyProportions: bodyProportionsDraft } : {}),
          ...(bodyProportionsMetaDraft ? { bodyProportionsMeta: bodyProportionsMetaDraft } : {}),
          ...(bodyModeDraft ? { bodyMode: bodyModeDraft } : {}),
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
      const generationModule = resolveCreateModelGenerationModule(moduleResponse.items, {
        isOwner: owner,
        identityMode,
      });
      setGenerationModuleInfo(generationModule);

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

      // The workflow contract separates body controls, scene controls and the
      // identity/head prompt. Scene defaults stay deterministic so the same
      // identity settings produce a predictable first preview.
      const occupationContext = getOccupationGenerationContext(
        selections.occupation,
        customValues.occupation,
      );
      // Every generation gets fresh independent 15-digit seeds. Seed Head also
      // selects the hidden server-side facial geometry deterministically.
      const bodySeed = generationSeed();
      const headSeed = generationSeed();
      const selectedPrompt = (categoryId: "eyeColor" | "skinTone" | "hairColor") => {
        const selected = selections[categoryId];
        if (selected === "custom") return (customValues[categoryId] || "").trim();
        return colorOption(categoryId, selected)?.prompt || "";
      };
      let promptHead = "";
      if (identityMode === "create") {
        const promptResponse = await fetch("/api/model-head-prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            seed: String(headSeed),
            age: Math.max(18, Math.min(60, Math.round(Number(customValues.age ?? 25)))),
            ancestry: ancestry?.display_name || "",
            iris: selectedPrompt("eyeColor"),
            skin: selectedPrompt("skinTone"),
            hairColor: selectedPrompt("hairColor"),
            hairStyle: mediaValues.hairstyle || "",
            eyebrow: mediaValues.eyebrows || "",
            lips: mediaValues.lips || "",
          }),
        });
        if (!promptResponse.ok) throw new Error("No se pudo construir el prompt de rostro.");
        const promptPayload = await promptResponse.json() as { prompt?: string };
        promptHead = commaPrompt(promptPayload.prompt || "");
        if (!promptHead) throw new Error("El prompt de rostro llegó vacío.");
      }

      const hairLength = round1(Number(customValues.hairLength ?? 0));
      const rawBody = bodyProportionsDraft || {};
      const bodyNumber = (key: string, fallback = 0) => {
        const value = Number(rawBody[key]);
        return Number.isFinite(value) ? round1(value) : fallback;
      };
      const hipsIndex = Math.max(0, Math.min(3, Math.round(bodyNumber("hips", 0))));
      const hipsText = HIP_GENERATION_VALUES[hipsIndex];
      const complexionValue = String(rawBody.complexion || "slim").toLowerCase() === "thick" ? 2 : 1;

      let payload: Record<string, unknown>;
      if (generationModule.id === 8 && identityMode === "create") {
        // Local Create V5 contract. Send raw UI body controls; the Backoffice
        // pipeline owns the Slim/Ass/Breasts compensation so AppWeb never
        // applies those corrections twice.
        payload = {
          input_1: promptHead,
          input_2: complexionValue,
          input_4: bodySeed,
          input_5: headSeed,
          input_6: bodyNumber("buttSize", 0),
          input_7: bodyNumber("breasts", 0),
          input_8: bodyNumber("waist", 0),
          input_9: skinToneGenerationValue(selections.skinTone),
          input_10: bodyNumber("height", 0),
          input_11: bodyNumber("bubbleButt", 0),
          input_12: hairLength,
          input_13: "standing sexy pose",
          input_14: "front view, full body",
          input_15: "standing and looking directly at camera",
          input_16: occupationContext.place,
          input_17: " ",
          input_18: occupationContext.clothes,
          // input_19 is required in V5. A single space satisfies the transport
          // contract while the pipeline's clean()/strip() correctly turns it
          // into an empty optional detail.
          input_19: customValues.extraDetails?.trim() || " ",
          input_20: hipsText,
        };
      } else if (generationModule.id === 9 && identityMode === "existing") {
        // Local From Head V6 contract. It mirrors the local body/scene inputs
        // from Create V5 but receives the selected persisted head as input_21.
        if (!existingIdentityFile) throw new Error("Confirma un rostro de identidad antes de generar.");
        const headBlob = await downloadLibraryFile(existingIdentityFile.id);
        const headFile = new File(
          [headBlob],
          existingIdentityFile.filename || "identity-head.jpg",
          { type: existingIdentityFile.content_type || headBlob.type || "image/jpeg" },
        );

        payload = {
          input_2: complexionValue,
          input_4: bodySeed,
          input_5: headSeed,
          input_6: bodyNumber("buttSize", 0),
          input_7: bodyNumber("breasts", 0),
          input_8: bodyNumber("waist", 0),
          input_9: skinToneGenerationValue(selections.skinTone),
          input_10: bodyNumber("height", 0),
          input_11: bodyNumber("bubbleButt", 0),
          input_12: hairLength,
          input_13: "standing sexy pose",
          input_14: "front view, full body",
          input_15: "standing and looking directly at camera",
          input_16: occupationContext.place,
          input_17: " ",
          input_18: occupationContext.clothes,
          input_19: customValues.extraDetails?.trim() || " ",
          input_20: hipsText,
          input_21: headFile,
        };
      } else {
        // Historical remote contracts stay untouched.
        const basePayload = {
          input_1: round1(bodyBase.ass + bodyAdjustments.ass),
          input_2: round1(bodyBase.fat + bodyAdjustments.fat),
          input_3: round1(bodyBase.breasts + bodyAdjustments.breasts),
          input_4: skinToneGenerationValue(selections.skinTone),
          input_5: hairLength,
          input_6: round1(bodyBase.butt_elevation + bodyAdjustments.butt_elevation),
          input_7: "standing full-body confident feminine pose, natural posture",
          input_8: "standing naturally on the floor",
          input_9: "front view, full body",
          input_10: "standing and looking directly at camera",
          input_11: occupationContext.place,
          input_12: " ",
          input_13: occupationContext.clothes,
          input_14: customValues.extraDetails?.trim() || null,
        };

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
      console.table(Object.fromEntries(
        generationModule.inputs.map((definition) => [
          definition.key,
          { name: definition.name, value: payload[definition.key] },
        ]),
      ));
      console.log("Payload:", { inputs: payload });
      console.groupEnd();

      const execution = generationModule.id === 8 && identityMode === "create"
        ? await executeCreateModelWithPrivateFaceReference(generationModule.id, payload)
        : await executeGenerationModule(generationModule.id, payload);
      generationVisualClockRef.current = { id: execution.id, startedAtMs: Date.now() };
      setProgressClock(Date.now());
      setGeneratedExecution(execution);
      setActiveStep(identityDoneStepIndex);
      track(execution, {
        clickable: true,
        href: editingFinalModel ? `/models/${modelId}/face?edit=1` : `/models/${modelId}/face`,
        label: "Create Model IA",
      });

      // Persist the execution pointer immediately in the model itself. This is
      // what allows the generation screen to recover after an AppWeb or
      // Backend restart.
      try {
        const latestForExecutionPointer = await getAiModel(modelId);
        const baseDraftForExecutionPointer = latestForExecutionPointer.draft_json && typeof latestForExecutionPointer.draft_json === "object" ? latestForExecutionPointer.draft_json : {};
        const updated = await saveAiModelDraft(
          modelId,
          {
            ...baseDraftForExecutionPointer,
            ...identityDraftSnapshot({
              selections,
              mediaSelected,
              customValues,
              hairLengthTouched,
              completedSteps,
              activeStep: identityDoneStepIndex,
              bodyAdjustments,
              bodyBase,
              lastGenerationExecutionId: execution.id,
            }),
            // Backend draft persistence replaces draft_json rather than merging it.
            // Preserve the chosen identity source every time the execution pointer is saved.
            identityMode,
            existingIdentityFile,
            ...(bodyProportionsDraft ? { bodyProportions: bodyProportionsDraft } : {}),
            ...(bodyProportionsMetaDraft ? { bodyProportionsMeta: bodyProportionsMetaDraft } : {}),
            ...(bodyModeDraft ? { bodyMode: bodyModeDraft } : {}),
            last_generation_seeds: {
              body: bodySeed,
              head: headSeed,
              execution_id: execution.id,
            },
          },
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
      track(updated, { clickable: true, href: editingFinalModel ? `/models/${modelId}/face?edit=1` : `/models/${modelId}/face`, label: "Create Model IA" });
      notify.success(updated.status === "cancelled" ? "Generación cancelada." : "Cancelación solicitada.");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "No se pudo cancelar la generación.");
      try {
        const latest = await getGenerationExecution(executionId);
        setGeneratedExecution(latest);
        track(latest, { clickable: true, href: editingFinalModel ? `/models/${modelId}/face?edit=1` : `/models/${modelId}/face`, label: "Create Model IA" });
      } catch {
        // Backend status remains authoritative; keep the last safe local snapshot.
      }
    } finally {
      setCancellingGeneration(false);
    }
  }

  const generatedBodyImage = useMemo(() => {
    const outputIds = outputIdsForModule(generationModuleInfo);
    return outputIds
      ? generatedImageForCreateModelOutput(generationModuleInfo, generatedExecution?.outputs, outputIds.body)
      : null;
  }, [generatedExecution?.outputs, generationModuleInfo]);
  const generatedImage = useMemo(
    () => generatedBodyImage ?? collectGeneratedImages(generatedExecution?.outputs ?? {})[0] ?? null,
    [generatedBodyImage, generatedExecution?.outputs],
  );
  const generatedIdentityFace = useMemo(() => {
    const outputIds = outputIdsForModule(generationModuleInfo);
    return outputIds
      ? generatedImageForCreateModelOutput(generationModuleInfo, generatedExecution?.outputs, outputIds.head)
      : null;
  }, [generatedExecution?.outputs, generationModuleInfo]);
  const generatedPreviewUrl = generatedImageUrl(generatedImage);
  const generationIsActive = isGenerationActiveForUi(generatedExecution);
  const generationIsCancelling = isGenerationCancellationPending(generatedExecution);
  const generationIsFinalizing = isGenerationFinalizing(generatedExecution);
  const generationHasCompletedResult =
    !editingGeneratedResult &&
    generatedExecution?.status === "completed" &&
    Boolean(generatedPreviewUrl);
  const generationSurfaceVisible =
    generationRecoveryPending ||
    generatingModel ||
    generationIsBusy ||
    generationHasCompletedResult;

  // Backend is the single authority for the UI ETA. It already scopes the
  // learned estimate by the execution engine/provider (Modal, Owner Local,
  // local_docker, etc.). AppWeb must not apply a second provider-specific
  // timing formula on top of that contract.
  const estimatedGenerationSeconds =
    (generationLoadingProgressMode === "backend"
      ? generatedExecution?.loading_backend_estimated_duration_seconds ??
        generatedExecution?.estimated_duration_seconds
      : generatedExecution?.estimated_duration_seconds ??
        generatedExecution?.loading_backend_estimated_duration_seconds) ??
    generationModuleInfo?.pricing?.estimated_duration_seconds ??
    null;

  // Countdown and percentage intentionally share the exact same clock. The
  // execution's Backend timestamp keeps recovery/reload coherent instead of
  // restarting a visual timer when the page mounts again.
  const elapsedGenerationSeconds = useMemo(() => {
    if (generatingModel || !generatedExecution) return 0;
    if (generatedExecution.status === "queued" && !generatedExecution.started_at) return 0;

    const startedAt = generatedExecution.started_at || generatedExecution.created_at;
    const startedMs = backendTimestampMs(startedAt);
    if (!Number.isFinite(startedMs)) return 0;

    const finishedMs = generatedExecution.finished_at
      ? backendTimestampMs(generatedExecution.finished_at)
      : progressClock;
    const endMs = Number.isFinite(finishedMs) ? finishedMs : progressClock;
    return Math.max(0, (endMs - startedMs) / 1000);
  }, [generatedExecution, generatingModel, progressClock]);

  const loadingDisplaySeconds = useMemo(() => {
    if (!estimatedGenerationSeconds || estimatedGenerationSeconds <= 0) return null;
    if (generatingModel) return estimatedGenerationSeconds;
    if (generatedExecution?.status === "completed") return 0;
    return Math.max(0, estimatedGenerationSeconds - elapsedGenerationSeconds);
  }, [elapsedGenerationSeconds, estimatedGenerationSeconds, generatedExecution?.status, generatingModel]);

  const estimatedGenerationProgress = useMemo(() => {
    if (generatingModel || !generatedExecution) return 0;
    if (generatedExecution.status === "completed") return 100;
    if (generatedExecution.status === "failed" || generatedExecution.status === "cancelled") {
      return Math.max(0, Math.min(95, generatedExecution.progress || 0));
    }

    // Without a usable Backend ETA, keep the existing backend-reported progress
    // as a safe fallback. As soon as ETA exists, countdown and bar are derived
    // from the same duration so neither can race ahead of the other.
    if (!estimatedGenerationSeconds || estimatedGenerationSeconds <= 0) {
      return Math.min(
        95,
        Math.max(generatedExecution.status === "queued" ? 2 : 8, generatedExecution.progress || 0),
      );
    }

    if (generatedExecution.status === "queued" && !generatedExecution.started_at) return 2;

    const timeProgress = (elapsedGenerationSeconds / estimatedGenerationSeconds) * 100;
    return Math.max(0, Math.min(95, timeProgress));
  }, [elapsedGenerationSeconds, estimatedGenerationSeconds, generatedExecution, generatingModel]);

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
      if (!outputIds) {
        notify.error("El módulo de esta generación ya no expone output_1 y output_2. Actualiza su contrato antes de usar el resultado.");
        return;
      }
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
    if (!target || target.kind === "summary") return;

    // A completed node is always revisitable. An unfinished node is available
    // as soon as every required node before it is complete. This keeps the
    // sequence strict without blocking the next legitimate step (for example
    // Rostro after switching from Crear rostro to Ya tengo un rostro).
    const previousRequiredSteps = identitySteps
      .slice(0, index)
      .filter((step) => step.kind !== "summary" && !step.optional);
    const previousStepsComplete = previousRequiredSteps.every((step) =>
      completedSteps.includes(step.id),
    );

    if (!completedSteps.includes(target.id) && !previousStepsComplete) {
      showValidation(`Completa los pasos anteriores antes de abrir ${target.label}.`);
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
    if (step.kind === "body") return completedSteps.includes(step.id) ? "done" : "";
    if (step.kind === "ancestry") return ancestry ? ancestry.ancestry_key || String(ancestry.id) : "";
    if (step.kind === "age") return customValues.age ?? "25";
    if (step.kind === "media") return mediaSelected[step.id] || "";
    if (step.kind === "range") return customValues.hairLength ?? "0";
    if (step.kind === "color") return selections[step.id] || "";
    if (step.kind === "occupation") return selections.occupation || "";
    if (step.kind === "extra") return customValues.extraDetails || "";
    if (step.kind === "identityFace") return existingIdentityFile ? String(existingIdentityFile.id) : "";
    return "";
  }


  function stepAfterCommit(stepId: StepId, completedAfter: string[]) {
    // After confirming any node, continue with the first required node that is
    // still incomplete. If none remain, always land on the summary. This is
    // important when revisiting an earlier completed node from “Modificar”:
    // confirming Proporciones must not walk through already-completed nodes.
    const firstIncompleteRequired = identitySteps.findIndex(
      (item) => item.kind !== "summary" && !item.optional && !completedAfter.includes(item.id),
    );
    return firstIncompleteRequired >= 0 ? firstIncompleteRequired : identityDoneStepIndex;
  }

  function commitCurrentStep(advance = true) {
    const step = currentStep;
    if (step.kind === "summary") return true;

    if (step.kind === "intro") {
      clearValidation();
      const completedAfter = completedSteps.includes(step.id) ? completedSteps : [...completedSteps, step.id];
      setCompletedSteps(completedAfter);
      if (advance) setActiveStep(stepAfterCommit(step.id, completedAfter));
      return true;
    }

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

    if (step.kind === "age") {
      clearValidation();
      const age = Math.max(18, Math.min(60, Math.round(Number(customValues.age ?? 25))));
      setCustomValues((current) => ({ ...current, age: String(age) }));
      const completedAfter = completedSteps.includes(step.id) ? completedSteps : [...completedSteps, step.id];
      setCompletedSteps(completedAfter);
      if (advance) setActiveStep(stepAfterCommit(step.id, completedAfter));
      return true;
    }

    if (step.kind === "range") {
      clearValidation();
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
    if (step.kind === "range") {
      return Number(customValues.hairLength ?? 0).toFixed(1);
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
        <ModelGlobalTimeline modelId={modelId} active="body" bodyConfirmed={Boolean(model.body_proportion_preset_id)} />
      </aside>
      <div className="modelStudioStageContent">
        <div className="modelStudio faceStudio pageEnter">
      <div className="modelHeaderShell">
        <button
          onClick={() => router.push(`/models/${modelId}?stage=identity`)}
          className="modelIconBtn modelBackOutside faceBack"
        >
          <ArrowLeft size={18} />
        </button>
        <header className="modelStudioHead">
          <div className="modelHeaderRail faceHeaderRail">
            <div className="modelEditableName">
              <h1>{displayName}</h1>
            </div>
            <div className="modelSculptWidget faceStepWidget">
              <div className="modelSculptWidgetBadge">02</div>
              <div className="modelSculptWidgetCopy">
                <h2>Crea un cuerpo</h2>
                <p>
                  Define el cuerpo y sus rasgos paso a paso. Confirma cada selección con Confirmar.
                </p>
              </div>
              <button type="button" className="modelDraftSaveButton" onClick={saveDraft} disabled={draftSaving}>
                <Save size={15} /> {draftSaving ? "Guardando…" : "Guardar borrador"}
              </button>
            </div>
          </div>
        </header>
      </div>

      <motion.div
        className={`faceAncestryStepTarget${currentStep?.id === "ancestry" ? " active" : ""}${generationSurfaceVisible ? " faceGenerationAncestryVisualExit" : ""}${generationAncestryCollapsed ? " faceGenerationAncestryExit" : ""}`}
        initial={prefersReducedMotion ? false : { opacity: 0, y: -18, scale: 0.992 }}
        animate={
          generationSurfaceVisible
            ? (prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -20, scale: 0.995, filter: "blur(0px)" })
            : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
        }
        transition={{ duration: prefersReducedMotion ? 0.12 : 0.3, ease: [0.22, 1, 0.36, 1] as const }}
        aria-hidden={generationSurfaceVisible}
      >
        {currentStep?.id === "ancestry" ? (
          <AncestryExperience modelId={modelId} value={ancestry} onChange={handleAncestryChange} />
        ) : null}
      </motion.div>

      <motion.div
        layout="position"
        transition={{ layout: { duration: prefersReducedMotion ? 0.12 : 0.32, ease: [0.22, 1, 0.36, 1] as const } }}
        className={`faceBuilder${generationSurfaceVisible ? " faceGenerationFocus" : ""}${!generationSurfaceVisible ? " facePreGenerationControlsOnly" : ""}${currentStep.kind === "body" ? " faceBodyProportionsOnly" : ""}`}
      >
        <motion.div
          ref={generationFocusPreviewRef}
          layout="position"
          transition={{ layout: { duration: prefersReducedMotion ? 0.12 : 0.36, ease: [0.22, 1, 0.36, 1] as const } }}
          className="facePreviewRail"
        >
          <section className="facePreviewCard">
            <div
              className={`facePreviewStage${generatedAspectRatio ? " facePreviewStageGenerated" : ""}`}
              style={generatedAspectRatio ? { aspectRatio: `${generatedAspectRatio}` } : undefined}
            >
              {generationSurfaceVisible ? (
                generationRecoveryPending ? (
                  <ParticleMorphLoader
                    sourceImages={[
                      "/generation-loaders/model-woman/silhouette-1.webp",
                      "/generation-loaders/model-woman/silhouette-2.webp",
                      "/generation-loaders/model-woman/silhouette-3.webp",
                    ]}
                    active
                    label="CREATE MODEL IA"
                    className="faceGenerationMorph faceGenerationRecoveryMorph"
                    statusText="Cargando resultado anterior…"
                    statusSubtext="Recuperando la generación guardada"
                    hideProgress
                    config={{
                      particleCount: 4500,
                      morphDurationMs: 1800,
                      holdDurationMs: 900,
                      dispersion: 34,
                      pointSize: 1.3,
                    }}
                  />
                ) : restoredExecution && generatedExecution?.status === "completed" && generatedPreviewUrl ? (
                  <div className="faceRecoveredResult" role="status" aria-live="polite">
                    {!restoredResultReady && (
                      <div className="faceRecoveredResultLoading faceRecoveredResultLoadingOverlay">
                        <span className="spinner" aria-hidden="true" />
                        <strong>Cargando resultado…</strong>
                        <small>Preparando la imagen guardada</small>
                      </div>
                    )}
                    <img
                      src={generatedPreviewUrl}
                      alt="Resultado generado"
                      className={restoredResultReady ? "isReady" : ""}
                      onLoad={(event) => {
                        const image = event.currentTarget;
                        if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                          setGeneratedAspectRatio(image.naturalWidth / image.naturalHeight);
                        }
                        setRestoredResultReady(true);
                      }}
                      onError={() => setRestoredResultReady(true)}
                    />
                  </div>
                ) : (
                <ParticleMorphLoader
                  sourceImages={[
                    "/generation-loaders/model-woman/silhouette-1.webp",
                    "/generation-loaders/model-woman/silhouette-2.webp",
                    "/generation-loaders/model-woman/silhouette-3.webp",
                  ]}
                  resultUrl={!generatingModel && generatedExecution?.status === "completed" ? generatedPreviewUrl : null}
                  active={generationIsBusy || generatingModel}
                  label="CREATE MODEL IA"
                  className="faceGenerationMorph"
                  progress={estimatedGenerationProgress}
                  estimatedSeconds={loadingDisplaySeconds}
                  secondsLabel="Tiempo estimado"
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
                )
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
            </div>
          </section>
          {generationHasCompletedResult && (
            <div className="faceGeneratedActions faceGeneratedActionsCentered">
              <button
                className="faceGenerateModelButton faceGenerateRetryButton"
                type="button"
                onClick={() => {
                  setEditingGeneratedResult(true);
                  const editableIndexes = identitySteps
                    .map((step, index) => ({ step, index }))
                    .filter(({ step }) => step.kind !== "summary");
                  const allRequiredComplete = editableIndexes
                    .filter(({ step }) => !step.optional)
                    .every(({ step }) => completedSteps.includes(step.id));

                  if (allRequiredComplete) {
                    const lastCompleted = [...editableIndexes]
                      .reverse()
                      .find(({ step }) => completedSteps.includes(step.id));
                    if (lastCompleted) setActiveStep(lastCompleted.index);
                  } else {
                    const firstIncomplete = editableIndexes.find(
                      ({ step }) => !step.optional && !completedSteps.includes(step.id),
                    );
                    if (firstIncomplete) setActiveStep(firstIncomplete.index);
                  }
                }}
              >
                <WandSparkles size={19} />
                <span><strong>Modificar</strong></span>
              </button>
              <button
                className="faceGenerateModelButton faceGenerateModelButtonDone faceUseGeneratedButton"
                type="button"
                onClick={() => void useGeneratedModel()}
                disabled={usingGeneratedModel}
              >
                <Check size={19} />
                {usingGeneratedModel ? "Guardando modelo…" : "Elegir esta"}
              </button>
            </div>
          )}
          {(generatingModel || generationIsActive || generationIsCancelling || cancellingGeneration) && (
            <button
              type="button"
              className="faceCancelGenerationButton"
              onClick={() => void cancelCurrentGeneration()}
              disabled={cancellingGeneration || generationIsCancelling || !canRequestGenerationCancellation(generatedExecution)}
            >
              {generationIsFinalizing ? "Finalizando resultado…" : generationIsCancelling || cancellingGeneration ? "Cancelando…" : !generatedExecution ? "Preparando…" : "Cancelar generación"}
            </button>
          )}
        </motion.div>

        <motion.section
          className="faceControls faceWizard"
          animate={
            generationSurfaceVisible
              ? { opacity: 0, x: 42, scale: 0.995 }
              : { opacity: 1, x: 0, scale: 1 }
          }
          transition={{
            duration: prefersReducedMotion ? 0.12 : 0.32,
            delay: 0,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
          style={{ transformOrigin: "left center" }}
          aria-hidden={generationSurfaceVisible}
        >
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

              {currentStep.kind === "body" && (
                <BodyProportionsStep
                  modelId={modelId}
                  initialBody={bodyProportionsDraft}
                  initialMeta={bodyProportionsMetaDraft}
                  legacyBodyCompatibility={Boolean(generationModuleInfo && generationModuleInfo.id !== 8 && generationModuleInfo.id !== 9)}
                  onDraftChange={(nextBody, nextMode, nextMeta) => { setBodyProportionsDraft(nextBody); setBodyModeDraft(nextMode); setBodyProportionsMetaDraft(nextMeta); }}
                  onComplete={() => {
                  clearValidation();
                  const completedAfter = completedSteps.includes(currentStep.id) ? completedSteps : [...completedSteps, currentStep.id];
                  setCompletedSteps(completedAfter);
                  setActiveStep(stepAfterCommit(currentStep.id, completedAfter));
                }} />
              )}

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

              {currentStep.kind === "age" && (
                <div className="modelV2Control faceAgeControl">
                  <div className="modelV2ControlMain">
                    <div className="modelV2ControlHead">
                      <strong>Edad</strong>
                      <output>{Math.max(18, Math.min(60, Math.round(Number(customValues.age ?? 25))))} años</output>
                    </div>
                    <FaceDiscreteSlider
                      value={Math.max(18, Math.min(60, Math.round(Number(customValues.age ?? 25))))}
                      min={18}
                      max={60}
                      step={1}
                      onChange={(value) => {
                        clearValidation();
                        setCustomValues((current) => ({ ...current, age: String(Math.round(value)) }));
                        if (completedSteps.includes("age")) {
                          setCompletedSteps((current) => current.filter((id) => id !== "age"));
                        }
                      }}
                    />
                    <div className="modelAxisEnds"><span>18</span><span>60</span></div>
                  </div>
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

              {currentStep.kind === "range" && currentStep.id === "hairLength" && (
                <div className="modelV2Control faceHairLengthControl">
                  <div className="modelV2ControlMain">
                    <div className="modelV2ControlHead">
                      <strong>Hair Length</strong>
                      <output>{Number(customValues.hairLength ?? 0).toFixed(1)}</output>
                    </div>
                    <FaceDiscreteSlider
                      value={Number(customValues.hairLength ?? 0)}
                      min={-6}
                      max={6}
                      step={0.2}
                      onChange={(value) => {
                        clearValidation();
                        setHairLengthTouched(true);
                        const nextValue = round1(value);
                        setCustomValues((current) => ({ ...current, hairLength: String(nextValue) }));
                        if (completedSteps.includes("hairLength")) {
                          setCompletedSteps((current) => current.filter((id) => id !== "hairLength"));
                        }
                      }}
                    />
                    <div className="modelAxisEnds"><span>-6</span><span>6</span></div>
                  </div>
                </div>
              )}

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
                      <h3>Tus elecciones están listas</h3>
                      <p>
                        Todos los pasos fueron confirmados. Ya puedes generar tu modelo.
                      </p>
                    </div>
                  </div>

                  {generationIsBusy ? (
                    <button className="faceGenerateModelButton faceGenerateModelButtonDone" type="button" disabled>
                      <WandSparkles size={19} />
                      {generationIsFinalizing ? "Finalizando resultado…" : generationIsCancelling ? "Cancelando generación…" : "Generando modelo…"}
                    </button>
                  ) : generatedExecution?.status === "completed" && generatedImage && !editingGeneratedResult ? (
                    <button className="faceGenerateModelButton faceGenerateModelButtonDone" type="button" disabled>
                      <Check size={19} /> Resultado listo
                    </button>
                  ) : (
                    <button
                      className="faceGenerateModelButton faceGenerateModelButtonDone"
                      type="button"
                      onClick={() => { void generateModel(); }}
                      disabled={generationRecoveryPending || generatingModel}
                    >
                      <WandSparkles size={19} />
                      <span>
                        <strong>{generatingModel ? "Enviando generación…" : generateButtonLabel}</strong>
                        {!generatingModel && <small>{generateTokenLabel}</small>}
                      </span>
                    </button>
                  )}

                  {editingGeneratedResult && generatedExecution?.status === "completed" && generatedPreviewUrl && (
                    <button
                      className="facePreviousResultButton"
                      type="button"
                      onClick={() => {
                        setRestoredExecution(false);
                        setRestoredResultReady(true);
                        setEditingGeneratedResult(false);
                      }}
                    >
                      <Eye size={18} /> Ver resultado anterior
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

              {currentStep.kind !== "summary" && currentStep.kind !== "body" && (
                <div className="faceStepConfirmRow">
                  <button
                    type="button"
                    className="faceChooseButton"
                    onClick={confirmCurrentStep}
                  >
                    <Check size={17} />
                    {currentStep.optional && !(customValues.extraDetails || "").trim()
                      ? "Continuar sin detalle"
                      : "Confirmar"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </motion.section>
      </motion.div>
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
