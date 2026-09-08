"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";

type StudioStage = "body" | "identity";

export function ModelGlobalTimeline({
  modelId,
  active,
  bodyConfirmed,
}: {
  modelId: number;
  active: StudioStage;
  bodyConfirmed: boolean;
}) {
  const router = useRouter();

  function go(stage: StudioStage) {
    if (stage === active) return;
    if (stage === "body" && !bodyConfirmed) {
      notify.error("Primero completa Identidad para continuar a Cuerpo.");
      return;
    }
    router.push(stage === "identity" ? `/models/${modelId}` : `/models/${modelId}?stage=body`);
  }

  return (
    <nav className="modelGlobalTimeline" aria-label="Etapas de creación del modelo">
      <button
        type="button"
        className={`modelGlobalStage${active === "identity" ? " active" : ""}${bodyConfirmed ? " complete" : ""}`}
        onClick={() => go("identity")}
        aria-current={active === "identity" ? "step" : undefined}
      >
        <span className="modelGlobalStageIcon">
          <img src="/model-stage-icons/identity.svg" alt="" aria-hidden="true" />
          {bodyConfirmed && <b><Check size={10}/></b>}
        </span>
        <span className="modelGlobalStageCopy"><small>PASO 01</small><strong>Identidad</strong></span>
      </button>
      <i className={`modelGlobalLine${bodyConfirmed ? " complete" : ""}`} aria-hidden="true"/>
      <button
        type="button"
        className={`modelGlobalStage${active === "body" ? " active" : ""}${!bodyConfirmed ? " locked" : ""}`}
        onClick={() => go("body")}
        aria-current={active === "body" ? "step" : undefined}
      >
        <span className="modelGlobalStageIcon">
          <img src="/model-stage-icons/body.svg" alt="" aria-hidden="true" />
        </span>
        <span className="modelGlobalStageCopy"><small>PASO 02</small><strong>Cuerpo</strong></span>
      </button>
    </nav>
  );
}
