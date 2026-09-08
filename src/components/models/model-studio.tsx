"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, Check, Pencil, Save, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAiModel, listBodyVariants, listBubbleButtVariants, saveAiModelDraft, setAiModelBody } from "@/lib/ai-model-api";
import { listModelGenerationAssets } from "@/lib/model-generation-assets-api";
import { uploadLibraryFileWithProgress } from "@/lib/user-library-api";
import { useModelDisplayName } from "@/lib/use-model-display-name";
import type { AiModelProfile, BodyVariant } from "@/types/ai-model";
import type { ModelGenerationAsset, ModelGenerationToolKey } from "@/types/model-generation-asset";
import type { ExistingIdentityFile, IdentitySourceMode } from "./identity-source-modal";
import { ModelImage } from "./model-image";
import { ModelGlobalTimeline } from "./model-global-timeline";

type BodyControlState={hips:number;buttSize:number;breasts:number;height:number;bubbleButt:number;waist:number;complexion:"slim"|"thick"};
const DEFAULT_BODY:BodyControlState={hips:1,buttSize:0,breasts:0,height:0,bubbleButt:0,waist:0,complexion:"slim"};
const BODY_TOOLS:ModelGenerationToolKey[]=["hips","butt_size","breasts","height","bubble_butt","waist","complexion"];
const HIP_LABELS=["Small Hips","Medium Hips","Big Hips","Huge Hips"];

function ordered(items:ModelGenerationAsset[]){return [...items].sort((a,b)=>(a.position??9999)-(b.position??9999)||a.sort_order-b.sort_order||a.id-b.id)}
function nearestAsset(items:ModelGenerationAsset[],ratio:number){const rows=ordered(items);if(!rows.length)return null;return rows[Math.round(Math.max(0,Math.min(1,ratio))*(rows.length-1))]??rows[0]}

export function ModelStudio({modelId}:{modelId:number}){
 const router=useRouter();
 const [model,setModel]=useState<AiModelProfile|null>(null);
 const [bodyVariants,setBodyVariants]=useState<BodyVariant[]>([]);
 const [assets,setAssets]=useState<Record<string,ModelGenerationAsset[]>>({});
 const [phase,setPhase]=useState<"identity"|"body">("identity");
 const [identityMode,setIdentityMode]=useState<IdentitySourceMode>("create");
 const [identityFile,setIdentityFile]=useState<ExistingIdentityFile|null>(null);
 const [uploading,setUploading]=useState(false); const [uploadProgress,setUploadProgress]=useState(0); const inputRef=useRef<HTMLInputElement|null>(null);
 const [body,setBody]=useState<BodyControlState>(DEFAULT_BODY);
 const [curvyMode,setCurvyMode]=useState(false);
 const [saving,setSaving]=useState(false); const [draftSaving,setDraftSaving]=useState(false); const [nameEditing,setNameEditing]=useState(false);
 const [displayName,setDisplayName]=useModelDisplayName(modelId,model?.name);

 useEffect(()=>{Promise.all([getAiModel(modelId),listBodyVariants("woman"),...BODY_TOOLS.map(tool=>listModelGenerationAssets(tool).catch(()=>({items:[],total:0})))])
  .then(([m,c,...catalogs])=>{setModel(m);setBodyVariants(c.items);const map:Record<string,ModelGenerationAsset[]>={};BODY_TOOLS.forEach((tool,i)=>map[tool]=ordered(catalogs[i].items));setAssets(map);
   const d=m.draft_json as Record<string,unknown>|undefined; const setup=d?.modelSetup as any; const proportions=d?.bodyProportions as Partial<BodyControlState>|undefined;
   if(setup?.identityMode)setIdentityMode(setup.identityMode); if(setup?.existingIdentityFile)setIdentityFile(setup.existingIdentityFile); if(proportions)setBody({...DEFAULT_BODY,...proportions});
   if(setup?.completed===true||m.body_proportion_preset_id)setPhase("body");
  }).catch(e=>toast.error(e instanceof Error?e.message:"No se pudo cargar Models IA"))},[modelId]);

 const preview=useMemo(()=>({
  hips:nearestAsset(assets.hips??[],body.hips/3), butt_size:nearestAsset(assets.butt_size??[],body.buttSize/(curvyMode?7:6)), breasts:nearestAsset(assets.breasts??[],(body.breasts+5)/10),
  height:nearestAsset(assets.height??[],(body.height+5)/10), bubble_butt:nearestAsset(assets.bubble_butt??[],body.bubbleButt/.7), waist:nearestAsset(assets.waist??[],(body.waist+3)/6),
  complexion:(assets.complexion??[]).find(x=>(x.title||x.asset_key).toLowerCase().includes(body.complexion))??nearestAsset(assets.complexion??[],body.complexion==="slim"?0:1)
 }),[assets,body,curvyMode]);

 async function chooseIdentityFile(candidate?:File){if(!candidate)return;if(!candidate.type.startsWith("image/")){toast.error("Selecciona una imagen válida.");return}setUploading(true);setUploadProgress(1);try{const f=await uploadLibraryFileWithProgress(candidate,setUploadProgress);setIdentityFile({id:f.id,filename:f.filename,content_type:f.content_type,url:f.url});setUploadProgress(100)}catch(e){toast.error(e instanceof Error?e.message:"No se pudo subir el rostro")}finally{setUploading(false)}}
 async function continueIdentity(){if(identityMode==="existing"&&!identityFile){toast.error("Sube un rostro antes de continuar.");return}setSaving(true);try{const current=(model?.draft_json&&typeof model.draft_json==="object")?model.draft_json:{};const updated=await saveAiModelDraft(modelId,{...current,modelSetup:{sex:"woman",identityMode,existingIdentityFile:identityMode==="existing"?identityFile:null,completed:true}},displayName.trim()||model?.name);setModel(updated);setPhase("body")}catch(e){toast.error(e instanceof Error?e.message:"No se pudo guardar Identidad")}finally{setSaving(false)}}
 async function saveBodyDraft(){setDraftSaving(true);try{const current=(model?.draft_json&&typeof model.draft_json==="object")?model.draft_json:{};const updated=await saveAiModelDraft(modelId,{...current,bodyProportions:body,bodyMode:curvyMode?"curvy":"fit"},displayName.trim()||model?.name);setModel(updated);toast.success("Borrador guardado")}catch(e){toast.error(e instanceof Error?e.message:"No se pudo guardar")}finally{setDraftSaving(false)}}
 async function continueBody(){if(!bodyVariants.length){toast.error("No hay presets corporales base disponibles.");return}setSaving(true);try{
   const hipsRatio=body.hips/3, breastRatio=(body.breasts+5)/10; const hipsVals=[...new Set(bodyVariants.map(x=>x.hips_size))].sort((a,b)=>a-b);const breastVals=[...new Set(bodyVariants.map(x=>x.breasts_size))].sort((a,b)=>a-b);
   const targetHip=hipsVals[Math.round(hipsRatio*Math.max(hipsVals.length-1,0))]??hipsVals[0];const targetBreast=breastVals[Math.round(breastRatio*Math.max(breastVals.length-1,0))]??breastVals[0];
   const preset=[...bodyVariants].sort((a,b)=>Math.abs(a.hips_size-targetHip)+Math.abs(a.breasts_size-targetBreast))[0]; if(!preset)throw new Error("No se pudo resolver el preset corporal base.");
   const bubbles=await listBubbleButtVariants(preset.id); const bubbleIndex=Math.round((body.bubbleButt/.7)*Math.max(bubbles.items.length-1,0));const bubble=bubbles.items[bubbleIndex]??bubbles.items[0];if(!bubble)throw new Error("Este cuerpo no tiene Butt Elevation disponible.");
   const current=(model?.draft_json&&typeof model.draft_json==="object")?model.draft_json:{};await saveAiModelDraft(modelId,{...current,bodyProportions:body,bodyMode:curvyMode?"curvy":"fit"},displayName.trim()||model?.name);await setAiModelBody(modelId,preset.id,bubble.id);router.push(`/models/${modelId}/face`);
  }catch(e){toast.error(e instanceof Error?e.message:"No se pudo continuar")}finally{setSaving(false)}}
 if(!model)return <div className="modelLoading pageEnter"><span className="spinner"/><p>Preparando el estudio…</p></div>;
 return <div className="modelStudioViewport modelStudioV2"><aside className="modelStudioStageRail"><ModelGlobalTimeline modelId={modelId} active={phase==="identity"?"identity":"body"} bodyConfirmed={phase==="body"}/></aside><div className="modelStudioStageContent"><div className="modelStudio pageEnter">
  <div className="modelHeaderShell"><button onClick={()=>router.push("/models")} className="modelIconBtn modelBackOutside"><ArrowLeft size={18}/></button><header className="modelStudioHead"><div className="modelHeaderRail"><div className="modelEditableName">{nameEditing?<input autoFocus value={displayName} maxLength={40} onChange={e=>setDisplayName(e.target.value)} onBlur={()=>setNameEditing(false)} onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape")setNameEditing(false)}}/>:<button type="button" onClick={()=>setNameEditing(true)}><h1>{displayName}</h1><Pencil size={13}/></button>}</div><div className="modelSculptWidget"><div className="modelSculptWidgetBadge">{phase==="identity"?"01":"02"}</div><div className="modelSculptWidgetCopy"><h2>{phase==="identity"?"Identidad":"Cuerpo"}</h2><p>{phase==="identity"?"Define quién será tu modelo antes de construir sus rasgos.":"Construye el cuerpo y después continúa con cabello, ojos y demás rasgos."}</p></div>{phase==="body"&&<button className="modelDraftSaveButton" onClick={saveBodyDraft} disabled={draftSaving}><Save size={15}/>{draftSaving?"Guardando…":"Guardar borrador"}</button>}</div></div></header></div>
  {phase==="identity"?<IdentitySetup name={displayName} setName={setDisplayName} mode={identityMode} setMode={setIdentityMode} file={identityFile} uploading={uploading} progress={uploadProgress} inputRef={inputRef} chooseFile={chooseIdentityFile} onContinue={continueIdentity} saving={saving}/>:<BodySetup body={body} setBody={setBody} curvy={curvyMode} setCurvy={setCurvyMode} preview={preview} onContinue={continueBody} saving={saving}/>} 
 </div></div></div>
}

function IdentitySetup({name,setName,mode,setMode,file,uploading,progress,inputRef,chooseFile,onContinue,saving}:{name:string;setName:(v:string)=>void;mode:IdentitySourceMode;setMode:(v:IdentitySourceMode)=>void;file:ExistingIdentityFile|null;uploading:boolean;progress:number;inputRef:React.RefObject<HTMLInputElement|null>;chooseFile:(f?:File)=>void;onContinue:()=>void;saving:boolean}){
 const drop=(e:DragEvent<HTMLButtonElement>)=>{e.preventDefault();if(!uploading)chooseFile(e.dataTransfer.files?.[0])};
 return <section className="modelV2Centered modelIdentityStep"><div className="modelV2NodeHead"><span>01</span><div><small>INFORMACIÓN INICIAL</small><h2>Identidad</h2><p>Configura los datos base y decide cómo crear el rostro.</p></div></div><div className="modelV2Field"><label>Sexo</label><div className="modelV2Sex"><button className="active"><strong>Mujer</strong><small>Disponible</small></button><button disabled><strong>Hombre</strong><small>Próximamente</small></button></div></div><div className="modelV2Field"><label>Nombre de la modelo</label><input value={name} maxLength={40} onChange={e=>setName(e.target.value)} placeholder="Ej. Sofia"/></div><div className="modelV2IdentityChoices"><button className={mode==="create"?"active":""} onClick={()=>setMode("create")}><img src="/identity-source/create-identity.svg" alt=""/><span><b>Crear identidad</b><small>Diseña el rostro y sus rasgos con IA.</small></span>{mode==="create"&&<i><Check size={13}/></i>}</button><button className={mode==="existing"?"active":""} onClick={()=>setMode("existing")}><img src="/identity-source/existing-face.svg" alt=""/><span><b>Ya tengo un rostro</b><small>Usa una imagen frontal autorizada.</small></span>{mode==="existing"&&<i><Check size={13}/></i>}</button></div>{mode==="existing"&&<><button className={`modelV2Drop${file?" hasFile":""}`} onClick={()=>!uploading&&inputRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={drop}>{file?<img src={file.url} alt="Rostro seleccionado"/>:<Upload size={24}/>}<span><b>{file?file.filename:"Arrastra aquí el rostro o haz clic para elegirlo"}</b><small>JPG, PNG o WEBP · imagen clara y frontal</small></span></button><input ref={inputRef} hidden type="file" accept="image/*" onChange={e=>chooseFile(e.target.files?.[0])}/>{(uploading||progress>0)&&<div className="modelV2Progress"><span style={{width:`${progress}%`}}/></div>}</>}<button className="modelConfirm" onClick={onContinue} disabled={saving||(mode==="existing"&&!file)}><Check size={17}/>{saving?"Guardando…":"Continuar a Cuerpo"}</button></section>
}

function BodySetup({body,setBody,curvy,setCurvy,preview,onContinue,saving}:{body:BodyControlState;setBody:React.Dispatch<React.SetStateAction<BodyControlState>>;curvy:boolean;setCurvy:(v:boolean)=>void;preview:Record<string,ModelGenerationAsset|null>;onContinue:()=>void;saving:boolean}){
 const set=<K extends keyof BodyControlState>(key:K,value:BodyControlState[K])=>setBody(s=>({...s,[key]:value}));
 return <section className="modelV2Centered modelBodyStep"><div className="modelV2NodeHead"><span>01</span><div><small>NODO 01</small><h2>Proporciones corporales</h2><p>Define la silueta base. Los previews cambian según las posiciones publicadas en Backoffice.</p></div></div><div className="modelV2Complexion"><label>Complexion</label><div>{(["slim","thick"] as const).map(v=><button key={v} className={body.complexion===v?"active":""} onClick={()=>set("complexion",v)}>{preview.complexion&&body.complexion===v?<AssetPreview asset={preview.complexion}/>:null}<b>{v==="slim"?"Slim":"Thick"}</b></button>)}</div></div><div className="modelV2ControlsGrid">
 <Control label="Hips" value={body.hips} display={HIP_LABELS[body.hips]} min={0} max={3} step={1} left="Small" right="Huge" asset={preview.hips} onChange={v=>set("hips",v)}/>
 <div><div className="modelV2ModeRow"><strong>Butt Size</strong><span><button className={!curvy?"active":""} onClick={()=>{setCurvy(false);if(body.buttSize>6)set("buttSize",6)}}>Fit</button><button className={curvy?"active":""} onClick={()=>setCurvy(true)}>Curvy</button></span></div><Control label="" value={body.buttSize} display={`+${body.buttSize}`} min={0} max={curvy?7:6} step={1} left="0" right={`+${curvy?7:6}`} asset={preview.butt_size} onChange={v=>set("buttSize",v)}/></div>
 <Control label="Breasts" value={body.breasts} display={body.breasts>0?`+${body.breasts}`:`${body.breasts}`} min={-5} max={5} step={1} left="-5" right="+5" asset={preview.breasts} onChange={v=>set("breasts",v)}/>
 <Control label="Height" value={body.height} display={body.height>0?`+${body.height}`:`${body.height}`} min={-5} max={5} step={1} left="-5" right="+5" asset={preview.height} onChange={v=>set("height",v)}/>
 <Control label="Bubble Butt" value={body.bubbleButt} display={body.bubbleButt.toFixed(1)} min={0} max={0.7} step={0.1} left="0" right="0.7" asset={preview.bubble_butt} onChange={v=>set("bubbleButt",Number(v.toFixed(1)))}/>
 <Control label="Waist" value={body.waist} display={body.waist>0?`+${body.waist}`:`${body.waist}`} min={-3} max={3} step={1} left="-3" right="+3" asset={preview.waist} onChange={v=>set("waist",v)}/>
 </div><button className="modelConfirm" onClick={onContinue} disabled={saving}><Check size={17}/>{saving?"Guardando…":"Continuar con los rasgos"}</button></section>
}
function AssetPreview({asset}:{asset:ModelGenerationAsset}){const src=asset.poster_url||asset.video_url;return src?<span className="modelV2AssetPreview">{asset.video_url&&!asset.poster_url?<video src={asset.video_url} muted playsInline/>:<img src={src} alt=""/>}</span>:null}
function Control({label,value,display,min,max,step,left,right,asset,onChange}:{label:string;value:number;display:string;min:number;max:number;step:number;left:string;right:string;asset:ModelGenerationAsset|null;onChange:(v:number)=>void}){return <div className="modelV2Control">{asset&&<AssetPreview asset={asset}/>}<div className="modelV2ControlMain"><div className="modelV2ControlHead"><strong>{label}</strong><output>{display}</output></div><DiscreteSlider value={value} min={min} max={max} step={step} onChange={onChange}/><div className="modelAxisEnds"><span>{left}</span><span>{right}</span></div></div></div>}
function DiscreteSlider({value,min,max,step,onChange}:{value:number;min:number;max:number;step:number;onChange:(v:number)=>void}){const ref=useRef<HTMLDivElement|null>(null);const drag=useRef(false);const percent=((value-min)/Math.max(max-min,step))*100;const update=(x:number)=>{const el=ref.current;if(!el)return;const r=el.getBoundingClientRect();const ratio=Math.max(0,Math.min(1,(x-r.left)/Math.max(r.width,1)));const raw=min+ratio*(max-min);const next=Math.max(min,Math.min(max,Math.round((raw-min)/step)*step+min));onChange(Number(next.toFixed(4)))};return <div ref={ref} className="modelDiscreteSlider" role="slider" tabIndex={0} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} onPointerDown={(e:ReactPointerEvent<HTMLDivElement>)=>{drag.current=true;e.currentTarget.setPointerCapture(e.pointerId);update(e.clientX)}} onPointerMove={(e:ReactPointerEvent<HTMLDivElement>)=>{if(drag.current)update(e.clientX)}} onPointerUp={e=>{drag.current=false;e.currentTarget.releasePointerCapture(e.pointerId)}} onKeyDown={e=>{if(e.key==="ArrowLeft"||e.key==="ArrowDown"){e.preventDefault();onChange(Math.max(min,value-step))}if(e.key==="ArrowRight"||e.key==="ArrowUp"){e.preventDefault();onChange(Math.min(max,value+step))}}}><div className="modelDiscreteRail"/><div className="modelDiscreteFill" style={{width:`${percent}%`}}/><span className="modelDiscreteThumb" style={{left:`${percent}%`}}/></div>}

