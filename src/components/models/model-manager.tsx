"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { createAiModel, listAiModels } from "@/lib/ai-model-api";
import type { AiModelProfile } from "@/types/ai-model";
import { ModelImage } from "./model-image";

export function ModelManager(){
  const [models,setModels]=useState<AiModelProfile[]>([]);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    listAiModels().then(setModels).catch(e=>toast.error(e instanceof Error?e.message:"No se pudieron cargar tus modelos"));
  },[]);

  async function create(){
    if(busy)return;
    setBusy(true);
    try{
      // El nombre y el género se configuran dentro del PASO 01 · Identidad.
      // El backend necesita un perfil antes de poder abrir /models/:id, así que
      // creamos únicamente el contenedor inicial y dejamos la configuración real
      // para el estudio.
      const model=await createAiModel("Nueva modelo","woman");
      location.href=`/models/${model.id}`;
    }catch(e){
      toast.error(e instanceof Error?e.message:"No se pudo crear");
      setBusy(false);
    }
  }

  return <div className="modelHome pageEnter">
    <header className="modelHomeHead">
      <div>
        <span className="eyebrow">CREATE MODEL IA</span>
        <h1>Tu casting. Tus reglas.</h1>
        <p>Crea identidades visuales y administra cada modelo desde su propio estudio.</p>
      </div>
      <button className="modelCreateBtn" onClick={create} disabled={busy}><Plus/> {busy?"Creando…":"Crear modelo"}</button>
    </header>

    {models.length
      ?<div className="modelCards">{models.map(m=><Link href={m.stage==="studio"?`/models/${m.id}/studio`:`/models/${m.id}`} className="modelCard" key={m.id}>
        <div className="modelCardVisual">
          {(m.generated_image_url&&m.selected_generation_file_id)
            ?<ModelImage src={m.generated_image_url} alt={m.name}/>
            :<div className="modelBlank"><UserRound/><span>Sin cuerpo seleccionado</span></div>}
          <span className="modelStage">{m.stage==="studio"?"MODELO LISTO":m.stage==="body_selected"?"CUERPO LISTO":"EN CREACIÓN"}</span>
        </div>
        <div className="modelCardCopy"><div><small>{m.sex==="woman"?"FEMALE MODEL":"MALE MODEL"}</small><h2>{m.name}</h2></div><b>Entrar al estudio →</b></div>
      </Link>)}</div>
      :<div className="modelEmpty modelEmptyHero">
        <Sparkles/>
        <h2>Tu primer modelo empieza aquí</h2>
        <p>Aún no tienes identidades creadas. Configura el nombre, género e identidad directamente dentro del Paso 01.</p>
        <button className="modelCreateBtn" onClick={create} disabled={busy}><Plus/> {busy?"Creando…":"Crear mi primera modelo"}</button>
      </div>}
  </div>;
}
