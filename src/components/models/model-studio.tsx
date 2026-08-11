"use client";
import { useEffect,useMemo,useRef,useState,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Grid3X3, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { getAiModel,listBodyVariants,setAiModelBody } from "@/lib/ai-model-api";
import type { AiModelProfile,BodyVariant } from "@/types/ai-model";
import { ModelImage } from "./model-image";

type AxisState={hips:number;fat:number;breasts:number};
const EPS=1e-6;
const displayBodyName=(value:string)=>value
 .replace(/\bAss\b/gi,"Hips")
 .replace(/([_\-])ass\b/gi,"$1hips");
const eq=(a:number,b:number)=>Math.abs(a-b)<EPS;
const distance=(v:BodyVariant,s:AxisState)=>Math.abs(v.hips_size-s.hips)+Math.abs(v.fat_thin-s.fat)+Math.abs(v.breasts_size-s.breasts);
const resolveVariant=(rows:BodyVariant[],s:AxisState)=>{
 const exact=rows.find(v=>eq(v.hips_size,s.hips)&&eq(v.fat_thin,s.fat)&&eq(v.breasts_size,s.breasts));
 if(exact)return exact;
 return [...rows].sort((a,b)=>distance(a,s)-distance(b,s))[0]??null;
};

export function ModelStudio({modelId}:{modelId:number}){
 const router=useRouter();
 const [model,setModel]=useState<AiModelProfile|null>(null);
 const [items,setItems]=useState<BodyVariant[]>([]);
 const [selected,setSelected]=useState<BodyVariant|null>(null);
 const [axes,setAxes]=useState<AxisState>({hips:0,fat:0,breasts:0});
 const [gallery,setGallery]=useState(false);
 const [fatFilter,setFatFilter]=useState("all"); const [hipFilter,setHipFilter]=useState("all"); const [breastFilter,setBreastFilter]=useState("all");
 const [saving,setSaving]=useState(false);
 const [transitionKey,setTransitionKey]=useState(0);

 useEffect(()=>{Promise.all([getAiModel(modelId),listBodyVariants("woman")]).then(([m,c])=>{
   setModel(m);setItems(c.items);
   const initial=c.items.find(x=>x.id===m.body_proportion_preset_id)||c.items[0]||null;
   setSelected(initial);
   if(initial)setAxes({hips:initial.hips_size,fat:initial.fat_thin,breasts:initial.breasts_size});
 }).catch(e=>toast.error(e instanceof Error?e.message:"No se pudo cargar el estudio"))},[modelId]);

 const values=useMemo(()=>({hips:[...new Set(items.map(x=>x.hips_size))].sort((a,b)=>a-b),fat:[...new Set(items.map(x=>x.fat_thin))].sort((a,b)=>b-a),breasts:[...new Set(items.map(x=>x.breasts_size))].sort((a,b)=>a-b)}),[items]);

 const chooseAxis=(key:keyof AxisState,value:number)=>{
   setAxes(current=>({...current,[key]:value}));
 };

 const chooseVariant=(v:BodyVariant)=>{setSelected(v);setAxes({hips:v.hips_size,fat:v.fat_thin,breasts:v.breasts_size});setTransitionKey(k=>k+1)};

 useEffect(()=>{
   if(!items.length)return;
   const timer=window.setTimeout(()=>{
     const resolved=resolveVariant(items,axes);
     if(resolved && resolved.id!==selected?.id){
       setSelected(resolved);
       setTransitionKey(k=>k+1);
     }
   },55);
   return()=>window.clearTimeout(timer);
 },[axes,items,selected?.id]);
 const filtered=items.filter(x=>(fatFilter==="all"||x.fat_band===fatFilter)&&(hipFilter==="all"||x.hips_band===hipFilter)&&(breastFilter==="all"||x.breast_band===breastFilter));
 const bands=(key:"fat_band"|"hips_band"|"breast_band")=>[...new Set(items.map(x=>x[key]).filter(Boolean))] as string[];
 async function confirm(){if(!selected)return;setSaving(true);try{const m=await setAiModelBody(modelId,selected.id);setModel(m);toast.success("Cuerpo guardado en tu modelo");}catch(e){toast.error(e instanceof Error?e.message:"No se pudo guardar")}finally{setSaving(false)}}
 if(!model)return <div className="modelLoading pageEnter"><span className="spinner"/><p>Preparando el estudio…</p></div>;
 return <div className="modelStudio pageEnter">
  <header className="modelStudioHead"><button onClick={()=>router.push("/models")} className="modelIconBtn"><ArrowLeft size={18}/></button><div><span className="eyebrow">CREATE MODEL IA · CUERPO</span><h1>{model.name}</h1><p>Define la silueta. Tus sliders conservan cada selección y la preview busca la combinación disponible correspondiente.</p></div><button className="modelGalleryBtn" onClick={()=>setGallery(true)}><Grid3X3 size={17}/> Ver todas las variantes</button></header>
  {items.length===0?<div className="modelEmpty"><Sparkles/><h2>Aún no hay cuerpos publicados</h2><p>Genera y guarda variantes desde Body Proportions en el BackOffice. Solo las imágenes listas aparecen aquí.</p></div>:<div className="modelBuilder">
   <section className="modelPreviewPanel"><div key={transitionKey} className="modelPreviewScanner">{selected&&<ModelImage src={selected.image_url} alt={displayBodyName(selected.display_name)} className="modelHeroImage"/>}</div>{selected&&<div className="modelPreviewMeta"><span>VARIANTE ACTUAL</span><strong>{displayBodyName(selected.display_name)}</strong><small>Hips {axes.hips} · Fat/Thin {axes.fat} · Breasts {axes.breasts}</small></div>}</section>
   <section className="modelControls"><div className="modelStep"><span>01</span><div><small>PROPORCIONES</small><h2>Esculpe su cuerpo</h2></div></div>
    <Axis label="Hips" value={axes.hips} values={values.hips} onChange={v=>chooseAxis("hips",v)}/><Axis label="Fat / Thin" value={axes.fat} values={values.fat} onChange={v=>chooseAxis("fat",v)}/><Axis label="Breasts" value={axes.breasts} values={values.breasts} onChange={v=>chooseAxis("breasts",v)}/>
    <div className="modelFineValues"><span>Skin tone <b>{selected?.skin_tone}</b></span><span>Hair length <b>{selected?.hair_length}</b></span></div>
    <button className="modelConfirm" onClick={confirm} disabled={!selected||saving}><Check size={17}/>{saving?"Guardando…":"Usar este cuerpo"}</button><p className="modelNextHint">El siguiente paso — rostro y unión con el cuerpo — queda preparado para la siguiente fase.</p>
   </section></div>}
  {gallery&&<div className="modelModal"><button className="modelModalBackdrop" onClick={()=>setGallery(false)} aria-label="Cerrar"/><div className="modelGallery"><header><div><span className="eyebrow">BIBLIOTECA CORPORAL</span><h2>Todas las variantes</h2><p>{filtered.length} de {items.length} disponibles</p></div><button className="modelIconBtn" onClick={()=>setGallery(false)}><X/></button></header><div className="modelFilters"><Filter label="Grasa" value={fatFilter} options={bands("fat_band")} onChange={setFatFilter}/><Filter label="Hips" value={hipFilter} options={bands("hips_band")} onChange={setHipFilter}/><Filter label="Breasts" value={breastFilter} options={bands("breast_band")} onChange={setBreastFilter}/></div><div className="modelGalleryGrid">{filtered.map(v=><button key={v.id} className={`modelVariant${selected?.id===v.id?" active":""}`} onClick={()=>{chooseVariant(v);setGallery(false)}}><ModelImage src={v.image_url} alt={displayBodyName(v.display_name)}/><div><strong>{displayBodyName(v.display_name)}</strong><small>H {v.hips_size} · F {v.fat_thin} · B {v.breasts_size}</small></div></button>)}</div></div></div>}
 </div>
}

function Axis({label,value,values,onChange}:{label:string;value:number;values:number[];onChange:(v:number)=>void}){
 const trackRef=useRef<HTMLDivElement|null>(null);
 const draggingRef=useRef(false);
 const index=Math.max(0,values.findIndex(v=>eq(v,value)));
 const safeIndex=index>=0?index:0;
 const percent=values.length<=1?0:(safeIndex/(values.length-1))*100;

 const updateFromClientX=(clientX:number)=>{
   const track=trackRef.current;
   if(!track||!values.length)return;
   const rect=track.getBoundingClientRect();
   const ratio=Math.min(1,Math.max(0,(clientX-rect.left)/Math.max(rect.width,1)));
   const nextIndex=Math.round(ratio*Math.max(values.length-1,0));
   const next=values[nextIndex];
   if(next!==undefined&&!eq(next,value))onChange(next);
 };

 const onPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
   draggingRef.current=true;
   event.currentTarget.setPointerCapture(event.pointerId);
   updateFromClientX(event.clientX);
 };
 const onPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
   if(!draggingRef.current)return;
   updateFromClientX(event.clientX);
 };
 const stopDrag=(event:ReactPointerEvent<HTMLDivElement>)=>{
   draggingRef.current=false;
   if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 };
 const onKeyDown=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
   if(!values.length)return;
   let nextIndex=safeIndex;
   if(event.key==="ArrowRight"||event.key==="ArrowUp")nextIndex=Math.min(values.length-1,safeIndex+1);
   else if(event.key==="ArrowLeft"||event.key==="ArrowDown")nextIndex=Math.max(0,safeIndex-1);
   else if(event.key==="Home")nextIndex=0;
   else if(event.key==="End")nextIndex=values.length-1;
   else return;
   event.preventDefault();
   onChange(values[nextIndex]??value);
 };

 return <div className="modelAxis">
   <div><label>{label}</label><output>{value}</output></div>
   <div
     ref={trackRef}
     className="modelDiscreteSlider"
     role="slider"
     tabIndex={0}
     aria-label={label}
     aria-valuemin={values[0]??0}
     aria-valuemax={values.at(-1)??0}
     aria-valuenow={value}
     onPointerDown={onPointerDown}
     onPointerMove={onPointerMove}
     onPointerUp={stopDrag}
     onPointerCancel={stopDrag}
     onKeyDown={onKeyDown}
   >
     <div className="modelDiscreteRail"/>
     <div className="modelDiscreteFill" style={{width:`${percent}%`}}/>
     {values.map((v,i)=><span key={`${label}-${v}`} className={`modelDiscreteTick${i===safeIndex?" active":""}`} style={{left:`${values.length<=1?0:(i/(values.length-1))*100}%`}}/>)}
     <span className="modelDiscreteThumb" style={{left:`${percent}%`}}/>
   </div>
   <div className="modelAxisEnds"><span>{values[0]??"—"}</span><span>{values.at(-1)??"—"}</span></div>
 </div>
}
function Filter({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){return <label><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="all">Todos</option>{options.map(x=><option value={x} key={x}>{x.replaceAll("_"," ")}</option>)}</select></label>}
