"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  Sparkles,
  WandSparkles,
  Pencil,
  Save,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { useModelDisplayName } from "@/lib/use-model-display-name";
import { getAiModel, listBodyVariants, listBubbleButtVariants, saveAiModelDraft } from "@/lib/ai-model-api";
import type { AiModelProfile } from "@/types/ai-model";
import {
  colorCategories,
  colorOption,
  defaultIdentitySelections,
  type IdentitySelections,
} from "@/lib/face-option-catalog";
import { listModelGenerationAssets } from "@/lib/model-generation-assets-api";
import { OCCUPATIONS, getOccupationLabel, type OccupationLocale } from "@/lib/occupation-catalog";
import type {
  ModelGenerationAsset,
  ModelGenerationToolKey,
} from "@/types/model-generation-asset";
import { ModelImage } from "./model-image";
import { ModelGlobalTimeline } from "./model-global-timeline";
import { AncestryExperience } from "./ancestry-experience";
import { useRouter } from "next/navigation";

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
  | "eyeColor"
  | "eyebrows"
  | "lips"
  | "skinTone"
  | "hairstyle"
  | "hairColor"
  | "occupation"
  | "extraDetails"
  | "summary";

type StepDefinition = {
  id: StepId;
  label: string;
  shortLabel: string;
  hint: string;
  kind: "color" | "media" | "occupation" | "extra" | "summary";
  optional?: boolean;
};

const STEPS: StepDefinition[] = [
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
    hint: "Revisa todas tus selecciones",
    kind: "summary",
  },
];

const IDENTITY_COMPLETABLE_STEP_IDS = STEPS.filter((step) => step.kind !== "summary").map((step) => step.id);
const IDENTITY_DONE_STEP_INDEX = STEPS.findIndex((step) => step.kind === "summary");

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
function signed(value: number) { return `${value > 0 ? "+" : ""}${round1(value).toFixed(1)}`; }
function normalizeBodyDelta(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return round1(Math.min(0.8, Math.max(-0.8, Math.round(number * 10) / 10)));
}


export function FaceStudio({ modelId }: { modelId: number }) {
  const router = useRouter();
  const [model, setModel] = useState<AiModelProfile | null>(null);
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
  const [bodyBase, setBodyBase] = useState({ ass: 0, fat: 0, breasts: 0, butt_elevation: 0 });
  const [bodyAdjustments, setBodyAdjustments] = useState({ ass: 0, fat: 0, breasts: 0, butt_elevation: 0 });
  const [bodyDraft, setBodyDraft] = useState({ ass: 0, fat: 0, breasts: 0, butt_elevation: 0 });
  const [draftSaving, setDraftSaving] = useState(false);

  useEffect(() => {
    getAiModel(modelId)
      .then((result) => {
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
            const restoredIsComplete = IDENTITY_COMPLETABLE_STEP_IDS.every((stepId) =>
              restoredCompletedSteps.includes(stepId),
            );
            setActiveStep(
              restoredIsComplete
                ? IDENTITY_DONE_STEP_INDEX
                : Number.isInteger(data.activeStep)
                  ? Math.min(Math.max(data.activeStep, 0), STEPS.length - 1)
                  : 0,
            );
          }
        } catch {}
      })
      .catch((error) =>
        notify.error(
          error instanceof Error
            ? error.message
            : "No se pudo abrir el estudio de rostro",
        ),
      );

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
  }, [modelId]);

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
          butt_elevation: bubble?.bubble_butt ?? 0,
        });
      })
      .catch(() => notify.warning("No se pudieron cargar los valores base del cuerpo para el refinamiento."));
  }, [model?.body_proportion_preset_id, model?.bubble_butt_preset_id, model?.bubble_butt_variant_index, model?.sex]);

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
          bodyRefinements: {
            ass: round1(bodyBase.ass + bodyAdjustments.ass),
            fat: round1(bodyBase.fat + bodyAdjustments.fat),
            breasts: round1(bodyBase.breasts + bodyAdjustments.breasts),
            butt_elevation: round1(bodyBase.butt_elevation + bodyAdjustments.butt_elevation),
          },
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
  ]);

  async function saveDraft() {
    setDraftSaving(true);
    const draft = {
      kind: "identity", selections, mediaSelected, customValues, completedSteps, activeStep, bodyAdjustments,
      bodyRefinements: {
        ass: round1(bodyBase.ass + bodyAdjustments.ass),
        fat: round1(bodyBase.fat + bodyAdjustments.fat),
        breasts: round1(bodyBase.breasts + bodyAdjustments.breasts),
        butt_elevation: round1(bodyBase.butt_elevation + bodyAdjustments.butt_elevation),
      },
    };
    try {
      const updated = await saveAiModelDraft(modelId, draft, displayName.trim() || model?.name);
      setModel(updated);
      notify.success("Borrador guardado");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "No se pudo guardar el borrador");
    } finally { setDraftSaving(false); }
  }

  const currentStep = STEPS[activeStep];
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
  const summaryReady = STEPS.filter(
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
    const target = STEPS[index];
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
    if (step.kind === "media") return mediaSelected[step.id] || "";
    if (step.kind === "color") return selections[step.id] || "";
    if (step.kind === "occupation") return selections.occupation || "";
    if (step.kind === "extra") return customValues.extraDetails || "";
    return "";
  }


  function commitCurrentStep(advance = true) {
    const step = currentStep;
    if (step.kind === "summary") return true;

    if (step.kind === "extra") {
      clearValidation();
      const value = (customValues.extraDetails || "").trim();
      setPendingValues((current) => ({ ...current, extraDetails: value }));
      setCompletedSteps((current) => current.includes(step.id) ? current : [...current, step.id]);
      if (advance) setActiveStep((index) => Math.min(index + 1, STEPS.length - 1));
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
    setCompletedSteps((current) => current.includes(step.id) ? current : [...current, step.id]);
    if (advance) setActiveStep((index) => Math.min(index + 1, STEPS.length - 1));
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
    <div className="modelStudio faceStudio pageEnter">
      <ModelGlobalTimeline modelId={modelId} active="identity" bodyConfirmed={Boolean(model.body_proportion_preset_id)} />
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

      <AncestryExperience modelId={modelId} onChange={() => {}} />

      <div className="faceBuilder">
        <div className="facePreviewRail">
          <section className="facePreviewCard">
            <div className="facePreviewStage">
              {model.body_image_url ? (
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
              {bodyRefineOpen && (
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
        </div>

        <section className="faceControls faceWizard">
          <div className="faceControlsIntro faceControlsIntroCompact">
            <span>
              {Math.min(activeStep + 1, STEPS.length)}/{STEPS.length}
            </span>
          </div>

          <div className="faceStepTimeline" role="navigation" aria-label="Pasos de identidad">
            {STEPS.map((step, index) => {
              const complete =
                step.id === "summary"
                  ? summaryReady
                  : completedSteps.includes(step.id);
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
                    {complete && step.id !== "summary" && (
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
              <div className="faceStepHeading">
                <span>{currentStep.hint}</span>
              </div>

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

              {currentStep.kind === "summary" && (
                <div className="faceSummary faceSummaryMinimal">
                  <div className="faceSummaryHero">
                    <span className="faceSummaryDoneIcon">
                      <Check size={24} />
                    </span>
                    <div>
                      <span>STEP DONE</span>
                      <h3>Tu identidad está lista</h3>
                      <p>
                        Todos los pasos fueron confirmados. Ya puedes generar tu modelo.
                      </p>
                    </div>
                  </div>

                  <button
                    className="faceGenerateModelButton faceGenerateModelButtonDone"
                    type="button"
                  >
                    <WandSparkles size={19} />
                    Generar modelo
                  </button>
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

