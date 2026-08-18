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
    if (stage === "identity" && !bodyConfirmed) {
      notify.error("Primero debes elegir y guardar un cuerpo para continuar a Identidad.");
      return;
    }
    router.push(stage === "body" ? `/models/${modelId}?stage=body` : `/models/${modelId}/face`);
  }

  return (
    <nav className="modelGlobalTimeline" aria-label="Etapas de creación del modelo">
      <button
        type="button"
        className={`modelGlobalStage${active === "body" ? " active" : ""}${bodyConfirmed ? " complete" : ""}`}
        onClick={() => go("body")}
        aria-current={active === "body" ? "step" : undefined}
      >
        <span className="modelGlobalStageIcon">
          <img src="/model-stage-icons/body.svg" alt="" aria-hidden="true" />
          {bodyConfirmed && <b><Check size={10}/></b>}
        </span>
        <span className="modelGlobalStageCopy"><small>PASO 01</small><strong>Cuerpo</strong></span>
      </button>
      <i className={`modelGlobalLine${bodyConfirmed ? " complete" : ""}`} aria-hidden="true"/>
      <button
        type="button"
        className={`modelGlobalStage${active === "identity" ? " active" : ""}${!bodyConfirmed ? " locked" : ""}`}
        onClick={() => go("identity")}
        aria-current={active === "identity" ? "step" : undefined}
      >
        <span className="modelGlobalStageIcon">
          <img src="/model-stage-icons/identity.svg" alt="" aria-hidden="true" />
        </span>
        <span className="modelGlobalStageCopy"><small>PASO 02</small><strong>Identidad</strong></span>
      </button>
    </nav>
  );
}
