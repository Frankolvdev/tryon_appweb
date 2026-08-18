"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  ListChecks,
  Palette,
  Scissors,
  Smile,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { notify } from "@/lib/notify";
import { getAiModel } from "@/lib/ai-model-api";
import type { AiModelProfile } from "@/types/ai-model";
import {
  buildIdentityPrompt,
  colorCategories,
  colorOption,
  defaultIdentitySelections,
  type IdentitySelections,
} from "@/lib/face-option-catalog";
import { listModelGenerationAssets } from "@/lib/model-generation-assets-api";
import type {
  ModelGenerationAsset,
  ModelGenerationToolKey,
} from "@/types/model-generation-asset";
import { ModelImage } from "./model-image";
import { AncestryExperience } from "./ancestry-experience";
import type { AncestryMediaAsset } from "@/types/ancestry-media";
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
  | "extraDetails"
  | "summary";

type StepDefinition = {
  id: StepId;
  label: string;
  shortLabel: string;
  hint: string;
  kind: "color" | "media" | "extra" | "summary";
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
    id: "extraDetails",
    label: "Extra details",
    shortLabel: "Extra",
    hint: "Detalle opcional de hasta 10 caracteres",
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

function StepIcon({ id, size = 16 }: { id: StepId; size?: number }) {
  if (id === "eyeColor") return <Eye size={size} />;
  if (id === "eyebrows") return <Sparkles size={size} />;
  if (id === "lips") return <Smile size={size} />;
  if (id === "skinTone") return <Palette size={size} />;
  if (id === "hairstyle") return <Scissors size={size} />;
  if (id === "hairColor") return <Palette size={size} />;
  if (id === "extraDetails") return <WandSparkles size={size} />;
  return <ListChecks size={size} />;
}

export function FaceStudio({ modelId }: { modelId: number }) {
  const router = useRouter();
  const [model, setModel] = useState<AiModelProfile | null>(null);
  const [selections, setSelections] =
    useState<IdentitySelections>(defaultIdentitySelections);
  const [mediaAssets, setMediaAssets] = useState<
    Record<string, ModelGenerationAsset[]>
  >({ eyebrows: [], lips: [], hairstyle: [] });
  const [mediaSelected, setMediaSelected] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [promptOpen, setPromptOpen] = useState(false);
  const [ancestry, setAncestry] = useState<AncestryMediaAsset | null>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    getAiModel(modelId)
      .then((result) => {
        setModel(result);
        try {
          const saved = localStorage.getItem(`${STORAGE_PREFIX}${modelId}`);
          if (saved) {
            const data = JSON.parse(saved);
            setSelections({
              ...defaultIdentitySelections,
              ...(data.selections || {}),
            });
            setMediaSelected(data.mediaSelected || {});
            setCustomValues(data.customValues || {});
            setCompletedSteps(data.completedSteps || []);
            setActiveStep(
              Number.isInteger(data.activeStep)
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
    try {
      localStorage.setItem(
        `${STORAGE_PREFIX}${modelId}`,
        JSON.stringify({
          selections,
          mediaSelected,
          customValues,
          completedSteps,
          activeStep,
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
  ]);

  const mediaValues = useMemo(
    () =>
      Object.fromEntries(
        MEDIA_TOOLS.map((tool) => {
          const key = mediaSelected[tool.id];
          if (key === "custom") return [tool.id, ""];
          const item = mediaAssets[tool.id]?.find(
            (value) => value.asset_key === key,
          );
          return [tool.id, item?.value || ""];
        }),
      ),
    [mediaAssets, mediaSelected],
  );

  const built = useMemo(
    () =>
      buildIdentityPrompt({
        selections,
        ancestryLabel: ancestry?.display_name,
        mediaValues,
        customValues,
      }),
    [
      selections,
      ancestry?.display_name,
      mediaValues,
      customValues,
    ],
  );

  const selectedCount =
    (ancestry ? 1 : 0) +
    colorCategories.filter((category) =>
      completedSteps.includes(category.id),
    ).length +
    MEDIA_TOOLS.filter((tool) => completedSteps.includes(tool.id)).length +
    (completedSteps.includes("extraDetails") ? 1 : 0);

  const total = 1 + colorCategories.length + MEDIA_TOOLS.length + 1;

  const currentStep = STEPS[activeStep];
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
    const target = STEPS[index];
    if (target?.id === "summary" && !summaryReady) {
      showValidation("Completa los pasos obligatorios antes de abrir el resumen.");
      return;
    }
    clearValidation();
    setActiveStep(index);
  }

  function setCustom(key: string, value: string) {
    clearValidation();
    setCustomValues((current) => ({
      ...current,
      [key]: value.slice(0, 10),
    }));
  }

  function pendingFor(step: StepDefinition) {
    if (pendingValues[step.id] !== undefined) return pendingValues[step.id];
    if (step.kind === "media") return mediaSelected[step.id] || "";
    if (step.kind === "color") return selections[step.id] || "";
    if (step.kind === "extra") return customValues.extraDetails || "";
    return "";
  }

  function validateStep(step: StepDefinition, requireConfirmed = false) {
    if (step.kind === "summary") return true;
    if (step.optional) return true;

    if (requireConfirmed && !completedSteps.includes(step.id)) {
      showValidation(`Primero pulsa Elegir en ${step.label}.`);
      return false;
    }

    const value = pendingFor(step);
    if (!value) {
      showValidation(`Debes elegir una opción en ${step.label}.`);
      return false;
    }

    if (
      value === "custom" &&
      !(customValues[step.id] || "").trim()
    ) {
      showValidation("Completa el campo Custom antes de continuar.");
      return false;
    }

    return true;
  }

  function moveStep(direction: 1 | -1) {
    if (direction === 1 && !validateStep(currentStep, true)) return;
    clearValidation();
    setActiveStep((index) =>
      Math.min(Math.max(index + direction, 0), STEPS.length - 1),
    );
  }

  function confirmCurrentStep() {
    const step = currentStep;
    if (step.kind === "summary") return;

    if (step.kind === "extra") {
      clearValidation();
      const value = (customValues.extraDetails || "").trim();
      setPendingValues((current) => ({
        ...current,
        extraDetails: value,
      }));
      setCompletedSteps((current) =>
        current.includes(step.id) ? current : [...current, step.id],
      );
      setActiveStep((index) => Math.min(index + 1, STEPS.length - 1));
      return;
    }

    const value = pendingFor(step);
    if (!value) {
      showValidation(`Debes elegir una opción en ${step.label}.`);
      return;
    }

    if (
      value === "custom" &&
      !(customValues[step.id] || "").trim()
    ) {
      showValidation("Completa el campo Custom antes de continuar.");
      return;
    }

    clearValidation();

    if (step.kind === "media") {
      setMediaSelected((current) => ({ ...current, [step.id]: value }));
    } else if (step.kind === "color") {
      setSelections((current) => ({ ...current, [step.id]: value }));
    }

    setCompletedSteps((current) =>
      current.includes(step.id) ? current : [...current, step.id],
    );

    setActiveStep((index) => Math.min(index + 1, STEPS.length - 1));
  }

  function choosePending(stepId: StepId, value: string) {
    clearValidation();
    setPendingValues((current) => ({ ...current, [stepId]: value }));
  }

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      notify.success(`${label} copiado`);
    } catch {
      notify.error("No se pudo copiar");
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
    if (step.kind === "extra") {
      return customValues.extraDetails?.trim() || "Sin detalle";
    }
    return "";
  }

  if (!model)
    return (
      <div className="modelLoading pageEnter">
        <span className="spinner" />
        <p>Preparando identidad…</p>
      </div>
    );

  return (
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
            <h1>{model.name}</h1>
            <div className="modelSculptWidget faceStepWidget">
              <div className="modelSculptWidgetBadge">02</div>
              <div className="modelSculptWidgetCopy">
                <h2>Diseña su identidad</h2>
                <p>
                  Explora cada preview, confirma con Elegir y avanza paso a
                  paso.
                </p>
              </div>
            </div>
          </div>
        </header>
      </div>

      <AncestryExperience modelId={modelId} onChange={setAncestry} />

      <div className="faceBuilder">
        <div className="facePreviewRail">
          <section className="facePreviewCard">
            <div className="facePreviewStage">
              {model.body_image_url ? (
                <ModelImage
                  src={model.body_image_url}
                  alt={`Cuerpo seleccionado de ${model.name}`}
                  className="faceBodyPreview"
                />
              ) : (
                <div className="facePreviewEmpty">
                  <Sparkles />
                  <strong>Cuerpo seleccionado</strong>
                  <span>Guarda primero el Paso 01 para continuar.</span>
                </div>
              )}
              <div className="facePreviewHud">
                <span>BODY LOCKED</span>
                <strong>{selectedCount} rasgos definidos</strong>
              </div>
            </div>
          </section>
          <div className="facePromptMini">
            <div>
              <WandSparkles size={16} />
              <span>Prompt en vivo</span>
            </div>
            <button type="button" onClick={() => setPromptOpen((value) => !value)}>
              {promptOpen ? "Ocultar" : "Ver prompt"}
            </button>
          </div>
        </div>

        <section className="faceControls faceWizard">
          <div className="faceControlsIntro">
            <div>
              <span>IDENTIDAD · EXPERIENCIA GUIADA</span>
              <strong>{currentStep.label}</strong>
            </div>
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
                    {complete && step.id !== "summary" ? (
                      <Check size={14} />
                    ) : (
                      <StepIcon id={step.id} size={15} />
                    )}
                  </span>
                  <small>{step.shortLabel}</small>
                </button>
              );
            })}
          </div>

          <div className="faceStepShell">
            <button
              type="button"
              className="faceStepArrow prev"
              onClick={() => moveStep(-1)}
              disabled={activeStep === 0}
              aria-label="Paso anterior"
            >
              <ChevronLeft size={22} />
            </button>

            <div className="faceStepContent">
              <div className="faceStepHeading">
                <span>{currentStep.hint}</span>
                <h3>{currentStep.label}</h3>
                {currentStep.kind !== "summary" && (
                  <p>
                    Haz click en una opción para previsualizarla. El cambio se
                    confirma únicamente cuando pulses <b>Elegir</b>.
                  </p>
                )}
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
                          maxLength={10}
                          placeholder="Máx. 10 caracteres"
                        />
                        <span>
                          {(customValues[currentStep.id] || "").length}/10
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
                          maxLength={10}
                          placeholder="Máx. 10 caracteres"
                        />
                        <span>
                          {(customValues[currentStep.id] || "").length}/10
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}

              {currentStep.kind === "extra" && (
                <div className="faceExtraStep">
                  <div className="faceExtraDetails">
                    <input
                      autoFocus
                      value={customValues.extraDetails || ""}
                      onChange={(event) =>
                        setCustom("extraDetails", event.target.value)
                      }
                      maxLength={10}
                      placeholder="Ej. freckles"
                    />
                    <span>
                      {(customValues.extraDetails || "").length}/10
                    </span>
                  </div>
                  <p>
                    Este paso es opcional. Puedes escribir un detalle o
                    continuar sin agregar ninguno.
                  </p>
                </div>
              )}

              {currentStep.kind === "summary" && (
                <div className="faceSummary">
                  <div className="faceSummaryHero">
                    <span className="faceSummaryDoneIcon">
                      <Check size={24} />
                    </span>
                    <div>
                      <span>STEP DONE</span>
                      <h3>Tu identidad está lista para revisar</h3>
                      <p>
                        Las previews animadas muestran exactamente las
                        selecciones confirmadas.
                      </p>
                    </div>
                  </div>

                  <div className="faceSummaryGrid">
                    {ancestry && (
                      <article className="faceSummaryCard ancestry">
                        <div className="faceSummaryMedia">
                          {ancestry.video_url ? (
                            <video
                              src={ancestry.video_url}
                              poster={ancestry.poster_url || undefined}
                              muted
                              loop
                              playsInline
                              autoPlay
                              controls={false}
                            />
                          ) : ancestry.poster_url ? (
                            <img src={ancestry.poster_url} alt="" />
                          ) : (
                            <Sparkles size={24} />
                          )}
                        </div>
                        <span>Ancestry</span>
                        <strong>{ancestry.display_name}</strong>
                      </article>
                    )}

                    {STEPS.filter(
                      (step) =>
                        step.kind !== "summary" && step.id !== "extraDetails",
                    ).map((step) => {
                      if (step.kind === "media") {
                        const key = mediaSelected[step.id];
                        const item = mediaAssets[step.id]?.find(
                          (asset) => asset.asset_key === key,
                        );
                        return (
                          <article className="faceSummaryCard" key={step.id}>
                            <div className="faceSummaryMedia">
                              {key === "custom" ? (
                                <WandSparkles size={26} />
                              ) : item?.video_url ? (
                                <video
                                  src={item.video_url}
                                  poster={item.poster_url || undefined}
                                  muted
                                  loop
                                  playsInline
                                  autoPlay
                                  controls={false}
                                  disablePictureInPicture
                                />
                              ) : item?.poster_url ? (
                                <img src={item.poster_url} alt="" />
                              ) : (
                                <Sparkles size={24} />
                              )}
                            </div>
                            <span>{step.label}</span>
                            <strong>{selectionLabel(step)}</strong>
                          </article>
                        );
                      }

                      const selected = colorOption(
                        step.id,
                        selections[step.id],
                      );
                      const custom = selections[step.id] === "custom";
                      return (
                        <article className="faceSummaryCard" key={step.id}>
                          <div className="faceSummaryColor">
                            <span
                              style={{
                                background: custom
                                  ? "conic-gradient(#f43f5e,#eab308,#22c55e,#3b82f6,#a855f7,#f43f5e)"
                                  : selected?.tone || "#333",
                              }}
                            />
                          </div>
                          <span>{step.label}</span>
                          <strong>{selectionLabel(step)}</strong>
                        </article>
                      );
                    })}

                    <article className="faceSummaryCard extra">
                      <div className="faceSummaryMedia">
                        <WandSparkles size={24} />
                      </div>
                      <span>Extra Details</span>
                      <strong>{selectionLabel(STEPS[6])}</strong>
                    </article>
                  </div>
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
                  <span>
                    {completedSteps.includes(currentStep.id)
                      ? `Seleccionado: ${selectionLabel(currentStep)}`
                      : "Aún no confirmado"}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="faceStepArrow next"
              onClick={() => moveStep(1)}
              disabled={activeStep === STEPS.length - 1}
              aria-label="Siguiente paso"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </section>
      </div>

      <button
        className="faceGenerateModelButton"
        type="button"
      >
        <WandSparkles size={19} />
        Generar modelo
      </button>

      {promptOpen && (
        <section className="facePromptPanel">
          <header>
            <div>
              <span>PROMPT BUILDER · FRONTEND</span>
              <h2>Prompt listo para conectar al pipeline</h2>
            </div>
            <button
              className="modelIconBtn"
              onClick={() => setPromptOpen(false)}
            >
              ×
            </button>
          </header>
          <div className="facePromptColumns">
            <div>
              <div className="facePromptLabel">
                <strong>Positive prompt</strong>
                <button onClick={() => copy(built.prompt, "Prompt")}>
                  <Copy size={14} /> Copiar
                </button>
              </div>
              <pre>{built.prompt}</pre>
            </div>
            <div>
              <div className="facePromptLabel">
                <strong>Negative prompt</strong>
                <button
                  onClick={() =>
                    copy(built.negativePrompt, "Negative prompt")
                  }
                >
                  <Copy size={14} /> Copiar
                </button>
              </div>
              <pre>{built.negativePrompt || "—"}</pre>
            </div>
          </div>
          <p className="facePromptNotice">
            Ancestry conserva su implementación actual. Esta experiencia guiada
            solo reorganiza los nuevos selectores de identidad.
          </p>
        </section>
      )}
    </div>
  );
}
