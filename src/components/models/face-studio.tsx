"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Copy, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { getAiModel } from "@/lib/ai-model-api";
import type { AiModelProfile } from "@/types/ai-model";
import { buildIdentityPrompt, colorCategories, colorOption, defaultIdentitySelections, type IdentitySelections } from "@/lib/face-option-catalog";
import { listModelGenerationAssets } from "@/lib/model-generation-assets-api";
import type { ModelGenerationAsset, ModelGenerationToolKey } from "@/types/model-generation-asset";
import { ModelImage } from "./model-image";
import { AncestryExperience } from "./ancestry-experience";
import type { AncestryMediaAsset } from "@/types/ancestry-media";
import { useRouter } from "next/navigation";

const STORAGE_PREFIX="tryon-face-draft-v2:";
const MEDIA_TOOLS:{id:ModelGenerationToolKey;label:string;hint:string}[]=[
 {id:"eyebrows",label:"Eyebrows",hint:"Forma de cejas"},
 {id:"lips",label:"Lips",hint:"Forma de labios"},
 {id:"hairstyle",label:"Hairstyle",hint:"Estilo de cabello"},
];

export function FaceStudio({modelId}:{modelId:number}){
 const router=useRouter();
 const [model,setModel]=useState<AiModelProfile|null>(null);
 const [selections,setSelections]=useState<IdentitySelections>(defaultIdentitySelections);
 const [mediaAssets,setMediaAssets]=useState<Record<string,ModelGenerationAsset[]>>({eyebrows:[],lips:[],hairstyle:[]});
 const [mediaSelected,setMediaSelected]=useState<Record<string,string>>({});
 const [customValues,setCustomValues]=useState<Record<string,string>>({});
 const [open,setOpen]=useState<string[]>(["eyebrows","lips","eyeColor","skinTone","hairstyle","hairColor"]);
 const [promptOpen,setPromptOpen]=useState(false);
 const [ancestry,setAncestry]=useState<AncestryMediaAsset|null>(null);

 useEffect(()=>{
   getAiModel(modelId).then(result=>{
     setModel(result);
     try{const saved=localStorage.getItem(`${STORAGE_PREFIX}${modelId}`);if(saved){const data=JSON.parse(saved);setSelections({...defaultIdentitySelections,...data.selections});setMediaSelected(data.mediaSelected||{});setCustomValues(data.customValues||{})}}catch{}
   }).catch(error=>toast.error(error instanceof Error?error.message:"No se pudo abrir el estudio de rostro"));
   Promise.all(MEDIA_TOOLS.map(async tool=>[tool.id,(await listModelGenerationAssets(tool.id)).items] as const)).then(entries=>setMediaAssets(Object.fromEntries(entries))).catch(()=>toast.error("No se pudieron cargar algunas previews de identidad."));
 },[modelId]);
 useEffect(()=>{try{localStorage.setItem(`${STORAGE_PREFIX}${modelId}`,JSON.stringify({selections,mediaSelected,customValues}))}catch{}},[modelId,selections,mediaSelected,customValues]);

 const mediaValues=useMemo(()=>Object.fromEntries(MEDIA_TOOLS.map(tool=>{const key=mediaSelected[tool.id];if(key==="custom")return[tool.id,""];const item=mediaAssets[tool.id]?.find(v=>v.asset_key===key);return[tool.id,item?.value||""]})),[mediaAssets,mediaSelected]);
 const built=useMemo(()=>buildIdentityPrompt({selections,ancestryLabel:ancestry?.display_name,mediaValues,customValues}),[selections,ancestry?.display_name,mediaValues,customValues]);
 const selectedCount=(ancestry?1:0)+colorCategories.filter(c=>Boolean(selections[c.id])).length+MEDIA_TOOLS.filter(t=>Boolean(mediaSelected[t.id])).length+(customValues.extraDetails?.trim()?1:0);
 const total=1+colorCategories.length+MEDIA_TOOLS.length+1;
 const toggle=(id:string)=>setOpen(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
 const setCustom=(key:string,value:string)=>setCustomValues(current=>({...current,[key]:value.slice(0,10)}));
 async function copy(value:string,label:string){try{await navigator.clipboard.writeText(value);toast.success(`${label} copiado`)}catch{toast.error("No se pudo copiar")}}
 if(!model)return <div className="modelLoading pageEnter"><span className="spinner"/><p>Preparando identidad…</p></div>;

 return <div className="modelStudio faceStudio pageEnter">
  <div className="modelHeaderShell"><button onClick={()=>router.push(`/models/${modelId}`)} className="modelIconBtn modelBackOutside faceBack"><ArrowLeft size={18}/></button><header className="modelStudioHead"><div className="modelHeaderRail faceHeaderRail"><h1>{model.name}</h1><div className="modelSculptWidget faceStepWidget"><div className="modelSculptWidgetBadge">02</div><div className="modelSculptWidgetCopy"><h2>Diseña su identidad</h2><p>Selecciona ancestry, cejas, labios, tonos y cabello. El resto del sistema permanece intacto.</p></div></div></div></header></div>
  <AncestryExperience modelId={modelId} onChange={setAncestry}/>
  <div className="faceBuilder">
   <div className="facePreviewRail"><section className="facePreviewCard"><div className="facePreviewStage">{model.body_image_url?<ModelImage src={model.body_image_url} alt={`Cuerpo seleccionado de ${model.name}`} className="faceBodyPreview"/>:<div className="facePreviewEmpty"><Sparkles/><strong>Cuerpo seleccionado</strong><span>Guarda primero el Paso 01 para continuar.</span></div>}<div className="facePreviewHud"><span>BODY LOCKED</span><strong>{selectedCount} rasgos definidos</strong></div></div></section><div className="facePromptMini"><div><WandSparkles size={16}/><span>Prompt en vivo</span></div><button type="button" onClick={()=>setPromptOpen(v=>!v)}>{promptOpen?"Ocultar":"Ver prompt"}</button></div></div>
   <section className="faceControls"><div className="faceControlsIntro"><div><span>IDENTIDAD</span><strong>Selecciona sus rasgos</strong></div><span>{selectedCount}/{total}</span></div><div className="faceCategoryList">
    {MEDIA_TOOLS.map(tool=>{const expanded=open.includes(tool.id);const current=mediaSelected[tool.id];const activeItem=mediaAssets[tool.id]?.find(v=>v.asset_key===current);return <div className={`faceCategory${expanded?" open":""}`} key={tool.id}><button type="button" className="faceCategoryHead" onClick={()=>toggle(tool.id)}><div><span>{tool.hint}</span><strong>{tool.label}</strong></div><div className="faceCategoryCurrent"><span>{current==="custom"?(customValues[tool.id]||"Custom"):activeItem?.title||"Seleccionar"}</span><ChevronDown size={16}/></div></button>{expanded&&<div className="faceMediaOptionGrid">{mediaAssets[tool.id]?.map(option=>{const active=current===option.asset_key;return <button type="button" className={`faceMediaOption${active?" selected":""}`} key={option.id} onClick={()=>setMediaSelected(s=>({...s,[tool.id]:option.asset_key}))}>{active&&option.video_url?<video key={`${option.id}-${option.video_url}`} src={option.video_url} poster={option.poster_url||undefined} muted loop playsInline autoPlay controls={false} disablePictureInPicture disableRemotePlayback controlsList="nodownload noplaybackrate noremoteplayback nofullscreen" tabIndex={-1} aria-hidden="true"/>:option.poster_url?<img src={option.poster_url} alt="" draggable={false} aria-hidden="true"/>:<div className="faceMediaFallback">{option.title}</div>}<span>{option.title}</span>{active&&<i><Check size={12}/></i>}</button>})}<button type="button" className={`faceCustomTile${current==="custom"?" selected":""}`} onClick={()=>setMediaSelected(s=>({...s,[tool.id]:"custom"}))}><b>+</b><span>Custom</span></button>{current==="custom"&&<div className="faceCustomField"><input autoFocus value={customValues[tool.id]||""} onChange={e=>setCustom(tool.id,e.target.value)} maxLength={10} placeholder="Máx. 10 caracteres"/><span>{(customValues[tool.id]||"").length}/10</span></div>}</div>}</div>})}
    {colorCategories.map(category=>{const expanded=open.includes(category.id);const current=selections[category.id];const selected=colorOption(category.id,current);return <div className={`faceCategory${expanded?" open":""}`} key={category.id}><button type="button" className="faceCategoryHead" onClick={()=>toggle(category.id)}><div><span>{category.hint}</span><strong>{category.label}</strong></div><div className="faceCategoryCurrent"><span>{current==="custom"?(customValues[category.id]||"Custom"):selected?.label||"Seleccionar"}</span><ChevronDown size={16}/></div></button>{expanded&&<div className="faceColorGrid">{category.options.map(option=>{const active=current===option.id;return <button type="button" key={option.id} className={`faceColorOption${active?" selected":""}`} onClick={()=>setSelections(s=>({...s,[category.id]:option.id}))}><span className="faceColorSwatch" style={{background:option.tone}}/><b>{option.label}</b>{active&&<i><Check size={12}/></i>}</button>})}<button type="button" className={`faceColorOption faceColorCustom${current==="custom"?" selected":""}`} onClick={()=>setSelections(s=>({...s,[category.id]:"custom"}))}><span className="faceColorSwatch custom">+</span><b>Custom</b></button>{current==="custom"&&<div className="faceCustomField"><input autoFocus value={customValues[category.id]||""} onChange={e=>setCustom(category.id,e.target.value)} maxLength={10} placeholder="Máx. 10 caracteres"/><span>{(customValues[category.id]||"").length}/10</span></div>}</div>}</div>})}
    <div className={`faceCategory${open.includes("extraDetails")?" open":""}`}><button type="button" className="faceCategoryHead" onClick={()=>toggle("extraDetails")}><div><span>Detalle opcional</span><strong>Extra Details</strong></div><div className="faceCategoryCurrent"><span>{customValues.extraDetails||"Custom"}</span><ChevronDown size={16}/></div></button>{open.includes("extraDetails")&&<div className="faceExtraDetails"><input value={customValues.extraDetails||""} onChange={e=>setCustom("extraDetails",e.target.value)} maxLength={10} placeholder="Máx. 10 caracteres"/><span>{(customValues.extraDetails||"").length}/10</span></div>}</div>
   </div><button className="faceGenerateButton" type="button" onClick={()=>{setPromptOpen(true);toast.success("Prompt de identidad preparado")}}><WandSparkles size={18}/>Preparar identidad</button></section>
  </div>
  {promptOpen&&<section className="facePromptPanel"><header><div><span>PROMPT BUILDER · FRONTEND</span><h2>Prompt listo para conectar al pipeline</h2></div><button className="modelIconBtn" onClick={()=>setPromptOpen(false)}>×</button></header><div className="facePromptColumns"><div><div className="facePromptLabel"><strong>Positive prompt</strong><button onClick={()=>copy(built.prompt,"Prompt")}><Copy size={14}/> Copiar</button></div><pre>{built.prompt}</pre></div><div><div className="facePromptLabel"><strong>Negative prompt</strong><button onClick={()=>copy(built.negativePrompt,"Negative prompt")}><Copy size={14}/> Copiar</button></div><pre>{built.negativePrompt||"—"}</pre></div></div><p className="facePromptNotice">Ancestry conserva su implementación actual. Cejas, labios y hairstyle provienen de Models IA; los colores son presets locales con opción Custom de 10 caracteres.</p></section>}
 </div>
}
