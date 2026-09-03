"use client";

import { ArrowLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteAiModel, getAiModel } from "@/lib/ai-model-api";
import { notify } from "@/lib/notify";
import type { AiModelProfile } from "@/types/ai-model";
import { ModelImage } from "./model-image";

export function FinalModelStudio({ modelId }: { modelId: number }) {
  const router = useRouter();
  const [model, setModel] = useState<AiModelProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getAiModel(modelId)
      .then((result) => {
        if (result.stage !== "studio") {
          router.replace(`/models/${modelId}`);
          return;
        }
        setModel(result);
      })
      .catch((error) => notify.error(error instanceof Error ? error.message : "No se pudo abrir el estudio."));
  }, [modelId, router]);

  async function removeModel() {
    if (!model) return;
    if (!window.confirm(`¿Eliminar definitivamente la modelo "${model.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteAiModel(model.id);
      notify.success("Modelo eliminado.");
      router.replace("/models");
      router.refresh();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "No se pudo eliminar la modelo.");
      setDeleting(false);
    }
  }

  if (!model) {
    return <div className="modelLoading pageEnter"><span className="spinner"/><p>Abriendo estudio…</p></div>;
  }

  return (
    <div className="modelHome pageEnter">
      <header className="modelHomeHead">
        <div>
          <span className="eyebrow">MODEL STUDIO</span>
          <h1>{model.name}</h1>
          <p>Tu modelo ya está listo. Este estudio queda preparado para las herramientas que agregaremos después.</p>
        </div>
        <button className="modelCreateBtn" type="button" onClick={() => router.push("/models")}>
          <ArrowLeft size={17}/> Mis modelos
        </button>
      </header>

      <section className="luxia-panel" style={{ maxWidth: 760, margin: "0 auto", borderRadius: 24, padding: 20 }}>
        {model.generated_image_url ? (
          <div style={{ width: "100%", maxHeight: 760, overflow: "hidden", borderRadius: 18, background: "#050505" }}>
            <ModelImage
              src={model.generated_image_url}
              alt={model.name}
              className="faceBodyPreview"
            />
          </div>
        ) : (
          <div className="modelBlank" style={{ minHeight: 360 }}>
            <span>No hay imagen final disponible.</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => void removeModel()}
          disabled={deleting}
          style={{
            marginTop: 18,
            width: "100%",
            minHeight: 46,
            borderRadius: 14,
            border: "1px solid rgba(239,68,68,.28)",
            background: "rgba(127,29,29,.16)",
            color: "#fca5a5",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Trash2 size={17}/>
          {deleting ? "Eliminando…" : "Eliminar modelo"}
        </button>
      </section>
    </div>
  );
}
