"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, ChevronDown, Copy, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { getAiModel } from "@/lib/ai-model-api";
import type { AiModelProfile } from "@/types/ai-model";
import { buildFacePrompt, defaultFaceSelections, faceCategories, optionFor, type FaceSelections } from "@/lib/face-option-catalog";
import { ModelImage } from "./model-image";
import { useRouter } from "next/navigation";

const STORAGE_PREFIX="tryon-face-draft-v1:";

function FaceOptionVisual({categoryId,optionId,tone}:{categoryId:string;optionId:string;tone?:string}){
 const visualTone=tone||"#b9b9c1";
 return <div className={`faceOptionVisual faceOptionVisual-${categoryId}`} style={{"--face-tone":visualTone} as CSSProperties}>
   <div className="faceOptionAvatar">
    <div className="faceOptionHair"/>
    <div className="faceOptionHead">
     <span className="faceOptionEye left"/><span className="faceOptionEye right"/>
     <span className="faceOptionNose"/>
     <span className="faceOptionMouth"/>
    </div>
   </div>
   <span className="faceOptionAccent" data-option={optionId}/>
  </div>
}

export function FaceStudio({modelId}:{modelId:number}){
 const router=useRouter();
 const [model,setModel]=useState<AiModelProfile|null>(null);
 const [selections,setSelections]=useState<FaceSelections>(defaultFaceSelections);
 const [open,setOpen]=useState<string[]>(["heritage","faceShape","eyeShape","eyeColor","hairColor"]);
 const [promptOpen,setPromptOpen]=useState(false);

 useEffect(()=>{
   getAiModel(modelId).then(result=>{
     setModel(result);
     try{
       const saved=localStorage.getItem(`${STORAGE_PREFIX}${modelId}`);
       if(saved)setSelections({...defaultFaceSelections,...JSON.parse(saved)});
     }catch{}
   }).catch(error=>toast.error(error instanceof Error?error.message:"No se pudo abrir el estudio de rostro"));
 },[modelId]);

 useEffect(()=>{
   try{localStorage.setItem(`${STORAGE_PREFIX}${modelId}`,JSON.stringify(selections))}catch{}
 },[modelId,selections]);

 const built=useMemo(()=>buildFacePrompt(selections),[selections]);
 const selectedCount=Object.values(selections).filter(Boolean).length;

 const toggle=(id:string)=>setOpen(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
 const choose=(categoryId:string,optionId:string)=>setSelections(current=>({...current,[categoryId]:optionId}));

 async function copy(value:string,label:string){
   try{await navigator.clipboard.writeText(value);toast.success(`${label} copiado`)}
   catch{toast.error("No se pudo copiar")}
 }

 if(!model)return <div className="modelLoading pageEnter"><span className="spinner"/><p>Preparando identidad…</p></div>;

 return <div className="modelStudio faceStudio pageEnter">
   <div className="modelHeaderShell">
    <button onClick={()=>router.push(`/models/${modelId}`)} className="modelIconBtn modelBackOutside faceBack"><ArrowLeft size={18}/></button>
    <header className="modelStudioHead">
     <div className="modelHeaderRail faceHeaderRail">
      <h1>{model.name}</h1>
      <div className="modelSculptWidget faceStepWidget">
       <div className="modelSculptWidgetBadge">02</div>
       <div className="modelSculptWidgetCopy">
        <h2>Diseña su rostro</h2>
        <p>Construye su identidad. Este paso prepara el prompt que después alimentará el pipeline de rostro + cuerpo.</p>
       </div>
      </div>
     </div>
    </header>
   </div>

   <div className="faceBuilder">
    <div className="facePreviewRail">
     <section className="facePreviewCard">
      <div className="facePreviewStage">
       {model.body_image_url
        ? <ModelImage src={model.body_image_url} alt={`Cuerpo seleccionado de ${model.name}`} className="faceBodyPreview"/>
        : <div className="facePreviewEmpty"><Sparkles/><strong>Cuerpo seleccionado</strong><span>Guarda primero el Paso 01 para continuar.</span></div>}
       <div className="facePreviewHud">
        <span>BODY LOCKED</span>
        <strong>{selectedCount} rasgos definidos</strong>
       </div>
      </div>
     </section>
     <div className="facePromptMini">
      <div><WandSparkles size={16}/><span>Prompt en vivo</span></div>
      <button type="button" onClick={()=>setPromptOpen(value=>!value)}>{promptOpen?"Ocultar":"Ver prompt"}</button>
     </div>
    </div>

    <section className="faceControls">
     <div className="faceControlsIntro">
      <div><span>IDENTIDAD</span><strong>Selecciona sus rasgos</strong></div>
      <span>{selectedCount}/{faceCategories.length}</span>
     </div>

     <div className="faceCategoryList">
      {faceCategories.map(category=>{
       const expanded=open.includes(category.id);
       const selected=optionFor(category.id,selections[category.id]||"");
       return <div className={`faceCategory${expanded?" open":""}`} key={category.id}>
        <button type="button" className="faceCategoryHead" onClick={()=>toggle(category.id)}>
         <div><span>{category.hint}</span><strong>{category.label}</strong></div>
         <div className="faceCategoryCurrent"><span>{selected?.label}</span><ChevronDown size={16}/></div>
        </button>
        {expanded&&<div className="faceOptionGrid">
         {category.options.map(option=>{
          const active=selections[category.id]===option.id;
          return <button type="button" key={option.id} className={`faceOption${active?" selected":""}`} onClick={()=>choose(category.id,option.id)} aria-pressed={active}>
           <FaceOptionVisual categoryId={category.id} optionId={option.id} tone={option.tone}/>
           <span>{option.label}</span>
           {active&&<i><Check size={12}/></i>}
          </button>
         })}
        </div>}
       </div>
      })}
     </div>

     <button className="faceGenerateButton" type="button" onClick={()=>{setPromptOpen(true);toast.success("Prompt de rostro preparado")}}>
      <WandSparkles size={18}/>
      Preparar rostro + cuerpo
     </button>
    </section>
   </div>

   {promptOpen&&<section className="facePromptPanel">
    <header><div><span>PROMPT BUILDER · FRONTEND</span><h2>Prompt listo para conectar al pipeline</h2></div><button className="modelIconBtn" onClick={()=>setPromptOpen(false)}>×</button></header>
    <div className="facePromptColumns">
     <div><div className="facePromptLabel"><strong>Positive prompt</strong><button onClick={()=>copy(built.prompt,"Prompt")}><Copy size={14}/> Copiar</button></div><pre>{built.prompt}</pre></div>
     <div><div className="facePromptLabel"><strong>Negative prompt</strong><button onClick={()=>copy(built.negativePrompt,"Negative prompt")}><Copy size={14}/> Copiar</button></div><pre>{built.negativePrompt||"—"}</pre></div>
    </div>
    <p className="facePromptNotice">Vista de integración: todavía no ejecuta el módulo de generación ni modifica Backend/BackOffice.</p>
   </section>}
  </div>
}
