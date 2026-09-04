"use client";
import { useEffect,useMemo,useRef,useState,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Sparkles, X, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { getAiModel,listBodyVariants,listBubbleButtVariants,setAiModelBody,saveAiModelDraft } from "@/lib/ai-model-api";
import type { AiModelProfile,BodyVariant,BubbleButtVariant } from "@/types/ai-model";
import { ModelImage } from "./model-image";
import { useModelDisplayName } from "@/lib/use-model-display-name";
import { ModelGlobalTimeline } from "./model-global-timeline";
import { IdentitySourceModal, type ExistingIdentityFile, type IdentitySourceMode } from "./identity-source-modal";

type AxisState={hips:number;fat:number;breasts:number;breastBand:string};
const EPS=1e-6;
const displayBodyName=(value:string)=>value
 .replace(/\bAss\b/gi,"Hips")
 .replace(/([_\-])ass\b/gi,"$1hips");
const eq=(a:number,b:number)=>Math.abs(a-b)<EPS;
const distance=(v:BodyVariant,s:AxisState)=>{
 const breastPenalty=s.breastBand&&v.breast_band!==s.breastBand?1000:0;
 return breastPenalty+Math.abs(v.hips_size-s.hips)+Math.abs(v.fat_thin-s.fat)+Math.abs(v.breasts_size-s.breasts);
};
const resolveVariant=(rows:BodyVariant[],s:AxisState)=>{
 const exact=rows.find(v=>eq(v.hips_size,s.hips)&&eq(v.fat_thin,s.fat)&&eq(v.breasts_size,s.breasts));
 if(exact)return exact;
 return [...rows].sort((a,b)=>distance(a,s)-distance(b,s))[0]??null;
};

function BodyStepScannerOverlay() {
 const [scanPercent,setScanPercent]=useState(10);

 useEffect(()=>{
   let raf=0;
   let disposed=false;
   const started=performance.now();

   const frame=(now:number)=>{
     if(disposed)return;
     // Same triangle-wave movement used by ParticleMorphLoader:
     // scanSpeed=0.27 and vertical travel from 10% to 90%.
     const scanT=((now-started)*0.001*0.27)%1;
     const wave=scanT<0.5?scanT*2:(1-scanT)*2;
     setScanPercent(10+wave*80);
     raf=requestAnimationFrame(frame);
   };

   raf=requestAnimationFrame(frame);
   return()=>{disposed=true;cancelAnimationFrame(raf)};
 },[]);

 return <div className="modelStep02ScannerOverlay" aria-hidden="true">
   <div
     className="modelStep02ScannerBand"
     style={{top:`${scanPercent}%`}}
   >
     <span className="modelStep02ScannerBracket left"/>
     <span className="modelStep02ScannerBracket right"/>
     <span className="modelStep02ScannerText">
       <b>ANALYZING</b>
       <small>{String(Math.round(scanPercent)).padStart(3,"0")}%</small>
     </span>
   </div>
 </div>;
}

export function ModelStudio({modelId}:{modelId:number}){
 const [identityChoiceOpen,setIdentityChoiceOpen]=useState(false);

 const router=useRouter();
 const searchParams=useSearchParams();
 const forceBodyStage=searchParams.get("stage")==="body";
 const [model,setModel]=useState<AiModelProfile|null>(null);
 const [nameEditing,setNameEditing]=useState(false);
 const [items,setItems]=useState<BodyVariant[]>([]);
 const [selected,setSelected]=useState<BodyVariant|null>(null);
 const [axes,setAxes]=useState<AxisState>({hips:0,fat:0,breasts:0,breastBand:""});
 const [gallery,setGallery]=useState(false);
 const [fatFilter,setFatFilter]=useState("all"); const [hipFilter,setHipFilter]=useState("all"); const [breastFilter,setBreastFilter]=useState("all");
 const [saving,setSaving]=useState(false);
 const [draftSaving,setDraftSaving]=useState(false);
 const [transitionKey,setTransitionKey]=useState(0);
 const [loadingTarget,setLoadingTarget]=useState<BodyVariant|null>(null);
 const [scannerFinishing,setScannerFinishing]=useState(false);
 const [bubbleVariants,setBubbleVariants]=useState<BubbleButtVariant[]>([]);
 const [bubbleLoading,setBubbleLoading]=useState(false);
 const [selectedBubbleLevel,setSelectedBubbleLevel]=useState(1);
 const bubbleRequestRef=useRef(0);
 const loadRequestRef=useRef(0);
 const decodedUrlsRef=useRef<Set<string>>(new Set());
 const MIN_SCANNER_MS=1300;

 useEffect(()=>{Promise.all([getAiModel(modelId),listBodyVariants("woman")]).then(([m,c])=>{
   if(m.stage==="studio"){
     router.replace(`/models/${modelId}/studio`);
     return;
   }
   if(m.body_proportion_preset_id&&!forceBodyStage){
     router.replace(`/models/${modelId}/face`);
     return;
   }
   setModel(m);setItems(c.items);
   const draft=m.draft_json as {kind?:string;body_proportion_preset_id?:number;bubble_butt_variant_index?:number}|undefined;
   const draftBodyId=draft?.kind==="body"?draft.body_proportion_preset_id:undefined;
   const initial=c.items.find(x=>x.id===draftBodyId)||c.items.find(x=>x.id===m.body_proportion_preset_id)||c.items[0]||null;
   setSelected(initial);
   setSelectedBubbleLevel(draft?.kind==="body"&&draft.bubble_butt_variant_index!=null?draft.bubble_butt_variant_index:(m.bubble_butt_variant_index ?? 1));
   if(initial)setAxes({hips:initial.hips_size,fat:initial.fat_thin,breasts:initial.breasts_size,breastBand:initial.breast_band||""});
 }).catch(e=>toast.error(e instanceof Error?e.message:"No se pudo cargar el estudio"))},[modelId,forceBodyStage,router]);

 const values=useMemo(()=>({
  hips:[...new Set(items.map(x=>x.hips_size))].sort((a,b)=>a-b),
  fat:[...new Set(items.map(x=>x.fat_thin))].sort((a,b)=>b-a)
 }),[items]);

 const breastLevels=useMemo(()=>{
   const groups=new Map<string,number[]>();
   for(const item of items){
     const band=item.breast_band||"";
     if(!band)continue;
     const row=groups.get(band)??[];
     row.push(item.breasts_size);
     groups.set(band,row);
   }
   return [...groups.entries()]
     .map(([band,nums])=>({
       band,
       value:nums.reduce((sum,n)=>sum+n,0)/Math.max(nums.length,1),
     }))
     .sort((a,b)=>a.value-b.value);
 },[items]);

 const chooseAxis=(key:keyof AxisState,value:number)=>{
   setAxes(current=>({...current,[key]:value}));
 };

 const chooseVariant=(v:BodyVariant)=>{
   setAxes({hips:v.hips_size,fat:v.fat_thin,breasts:v.breasts_size,breastBand:v.breast_band||""});
 };

 useEffect(()=>{
   if(!items.length)return;
   const timer=window.setTimeout(()=>{
     const resolved=resolveVariant(items,axes);
     if(!resolved||resolved.id===selected?.id){
       setLoadingTarget(null);
       return;
     }

     const requestId=++loadRequestRef.current;
     setLoadingTarget(resolved);
     setScannerFinishing(false);

     const minimumVisiblePromise=new Promise<void>(resolve=>{
       window.setTimeout(resolve,MIN_SCANNER_MS);
     });

     const imageReadyPromise=new Promise<void>((resolve,reject)=>{
       if(decodedUrlsRef.current.has(resolved.image_url)){
         resolve();
         return;
       }

       const image=new Image();
       image.decoding="async";
       image.src=resolved.image_url;

       const markReady=()=>{
         decodedUrlsRef.current.add(resolved.image_url);
         resolve();
       };

       const decode=image.decode?.bind(image);
       if(decode){
         decode().then(markReady).catch(()=>{
           if(image.complete&&image.naturalWidth>0){
             markReady();
           }else{
             image.onload=markReady;
             image.onerror=()=>reject(new Error("No se pudo cargar la imagen de la variante."));
           }
         });
       }else{
         image.onload=markReady;
         image.onerror=()=>reject(new Error("No se pudo cargar la imagen de la variante."));
       }
     });

     Promise.all([imageReadyPromise,minimumVisiblePromise])
       .then(()=>{
         if(loadRequestRef.current!==requestId)return;
         setSelected(resolved);
         setLoadingTarget(null);
         setTransitionKey(k=>k+1);
         setScannerFinishing(true);
         window.setTimeout(()=>{
           if(loadRequestRef.current===requestId)setScannerFinishing(false);
         },180);
       })
       .catch(()=>{
         if(loadRequestRef.current!==requestId)return;
         setLoadingTarget(null);
         setScannerFinishing(false);
       });
   },55);

   return()=>window.clearTimeout(timer);
 },[axes,items,selected?.id]);

 useEffect(()=>{
   if(!selected?.image_url)return;
   decodedUrlsRef.current.add(selected.image_url);
 },[selected?.image_url]);
 useEffect(()=>{
   if(!selected?.id){
     setBubbleVariants([]);
     setBubbleLoading(false);
     return;
   }
   const requestId=++bubbleRequestRef.current;
   setBubbleLoading(true);
   setBubbleVariants([]);
   listBubbleButtVariants(selected.id)
     .then(result=>{
       if(bubbleRequestRef.current!==requestId)return;
       setBubbleVariants(result.items);
     })
     .catch(()=>{
       if(bubbleRequestRef.current!==requestId)return;
       setBubbleVariants([]);
     })
     .finally(()=>{
       if(bubbleRequestRef.current===requestId)setBubbleLoading(false);
     });
 },[selected?.id]);

 const filtered=items.filter(x=>(fatFilter==="all"||x.fat_band===fatFilter)&&(hipFilter==="all"||x.hips_band===hipFilter)&&(breastFilter==="all"||x.breast_band===breastFilter));
 const bands=(key:"fat_band"|"hips_band"|"breast_band")=>[...new Set(items.map(x=>x[key]).filter(Boolean))] as string[];
 async function saveDraft(){
  if(!selected){toast.error("Selecciona un cuerpo antes de guardar el borrador.");return;}
  setDraftSaving(true);
  try{
   const updated=await saveAiModelDraft(modelId,{kind:"body",body_proportion_preset_id:selected.id,bubble_butt_variant_index:selectedBubbleLevel,axes},displayName.trim()||model?.name);
   setModel(updated);
   toast.success("Borrador guardado");
  }catch(e){toast.error(e instanceof Error?e.message:"No se pudo guardar el borrador")}finally{setDraftSaving(false)}
 }
 async function confirm(){
  if(!selected)return;
  const selectedBubble=bubbleVariants.find(item=>item.variant_index===selectedBubbleLevel);
  if(!selectedBubble){toast.error("Selecciona un nivel de Butt Elevation disponible.");return;}
  setSaving(true);
  try{
   const m=await setAiModelBody(modelId,selected.id,selectedBubble.id);
   setModel(m);
   toast.success("Cuerpo y Butt Elevation guardados en tu modelo");
   // Paso 01 ya quedó persistido. Antes de entrar al Paso 02 el usuario
   // elige la fuente de identidad; por defecto se mantiene Crear identidad.
   setIdentityChoiceOpen(true);
  }catch(e){toast.error(e instanceof Error?e.message:"No se pudo guardar")}finally{setSaving(false)}
 }
 async function confirmIdentitySource(mode:IdentitySourceMode,file:ExistingIdentityFile|null){
  try{
   const currentDraft=(model?.draft_json&&typeof model.draft_json==="object")?model.draft_json:{};
   const updated=await saveAiModelDraft(modelId,{
    ...currentDraft,
    kind:"identity",
    identityMode:mode,
    existingIdentityFile:mode==="existing"&&file?file:null,
   },displayName.trim()||model?.name);
   setModel(updated);
   setIdentityChoiceOpen(false);
   router.push(`/models/${modelId}/face`);
  }catch(e){toast.error(e instanceof Error?e.message:"No se pudo guardar la fuente de identidad")}
 }
 const [displayName,setDisplayName]=useModelDisplayName(modelId,model?.name);
 if(!model)return <div className="modelLoading pageEnter"><span className="spinner"/><p>Preparando el estudio…</p></div>;
 return <div className="modelStudioViewport">
  <aside className="modelStudioStageRail">
   <ModelGlobalTimeline modelId={modelId} active="body" bodyConfirmed={Boolean(model.body_proportion_preset_id)} />
  </aside>
  <div className="modelStudioStageContent">
   <div className="modelStudio pageEnter">
  <div className="modelHeaderShell">
   <button onClick={()=>router.push("/models")} className="modelIconBtn modelBackOutside"><ArrowLeft size={18}/></button>
   <header className="modelStudioHead">
    <div className="modelHeaderRail">
     <div className="modelEditableName">
      {nameEditing?<input autoFocus value={displayName} maxLength={40} onChange={e=>setDisplayName(e.target.value)} onBlur={()=>setNameEditing(false)} onKeyDown={e=>{if(e.key==="Enter"||e.key==="Escape")setNameEditing(false)}} aria-label="Nombre temporal de la modelo"/>:<button type="button" onClick={()=>setNameEditing(true)} title="Editar nombre temporal"><h1>{displayName}</h1><Pencil size={13}/></button>}
     </div>
     <div className="modelSculptWidget">
      <div className="modelSculptWidgetBadge">01</div>
      <div className="modelSculptWidgetCopy">
       <h2>Esculpe tu cuerpo</h2>
       <p>Define la silueta. Tus sliders conservan cada selección y la preview busca la combinación disponible correspondiente.</p>
      </div>
      <button type="button" className="modelDraftSaveButton" onClick={saveDraft} disabled={draftSaving}>
       <Save size={15}/>{draftSaving?"Guardando…":"Guardar borrador"}
      </button>
     </div>
    </div>
   </header>
  </div>
  {items.length===0?<div className="modelEmpty"><Sparkles/><h2>Aún no hay cuerpos publicados</h2><p>Genera y guarda variantes desde Body Proportions en el BackOffice. Solo las imágenes listas aparecen aquí.</p></div>:<div className="modelBuilder">
   <div className="modelLeftRail">
    <section className={`modelPreviewPanel${loadingTarget?" isLoading":""}`}>
     <div className={`modelPreviewHybrid${loadingTarget?" loading":""}${scannerFinishing?" finishing":""}`}>
       {selected&&<div key={transitionKey} className="modelPreviewCurrent"><ModelImage src={selected.image_url} alt={displayBodyName(selected.display_name)} className="modelHeroImage"/></div>}
       {(loadingTarget||scannerFinishing)&&<BodyStepScannerOverlay/>}
     </div>
    </section>
         
   
    
   
    <button className="modelGalleryBtn modelGalleryBtnBelow" onClick={()=>setGallery(true)}>
     <span className="modelGalleryCustomIcon" aria-hidden="true">
      <svg viewBox="0 0 32 32">
       <rect x="3.5" y="5" width="10" height="10" rx="2.5"/>
       <rect x="18.5" y="5" width="10" height="10" rx="2.5"/>
       <rect x="3.5" y="19" width="10" height="8" rx="2.5"/>
       <path d="M19.5 23h8M23.5 19v8"/>
       <path d="M6.5 12l2.1-2.1 2.2 2.2"/>
       <circle cx="24.5" cy="9" r="1.5"/>
      </svg>
     </span>
     <span>Ver todas las variantes</span>
    </button>
   </div>
   <section className="modelControls">
    <Axis label="Hips" value={axes.hips} values={values.hips} minLabel="Small" maxLabel="Huge" onChange={v=>chooseAxis("hips",v)}/><Axis label="Fat / Thin" value={axes.fat} values={values.fat} minLabel="Very Low Fat" maxLabel="Very High Fat" onChange={v=>chooseAxis("fat",v)}/><BreastAxis levels={breastLevels} selectedBand={axes.breastBand} onChange={level=>setAxes(current=>({...current,breastBand:level.band,breasts:level.value}))}/>
          <div className="modelBubblePicker">
     <div className="modelBubbleHeading"><strong>Butt Elevation</strong><span>{bubbleLoading?"Cargando…":`${bubbleVariants.length}/4 disponibles`}</span></div>
     <div className="modelBubbleRow">
     {bubbleLoading
     ? [1,2,3,4].map(index=><div key={index} className="modelBubbleCard loading"><div className="modelBubbleLoadingVisual"><div className="modelImagePlaceholder"><span>✦</span></div></div></div>)
     : [1,2,3,4].map(index=>{
     const variant=bubbleVariants.find(item=>item.variant_index===index);
     return variant
     ? <button type="button" key={variant.id} className={`modelBubbleCard${selectedBubbleLevel===index?" selected":""}`} onClick={()=>setSelectedBubbleLevel(index)} aria-pressed={selectedBubbleLevel===index}>
     <ModelImage src={variant.image_url} alt={variant.display_name}/>

     </button>
     : <div key={index} className="modelBubbleCard missing"><div className="modelBubbleMissing">Sin preview</div></div>;
     })}
     </div>
     </div>
     <button className="modelConfirm" onClick={confirm} disabled={!selected||saving||!bubbleVariants.some(item=>item.variant_index===selectedBubbleLevel)}><Check size={17}/>{saving?"Guardando…":"Usar este cuerpo"}</button>
   </section></div>}
  {gallery&&<div className="modelModal"><button className="modelModalBackdrop" onClick={()=>setGallery(false)} aria-label="Cerrar"/><div className="modelGallery"><header><div><span className="eyebrow">BIBLIOTECA CORPORAL</span><h2>Todas las variantes</h2><p>{filtered.length} de {items.length} disponibles</p></div><button className="modelIconBtn" onClick={()=>setGallery(false)}><X/></button></header><div className="modelFilters"><Filter label="Grasa" value={fatFilter} options={bands("fat_band")} onChange={setFatFilter}/><Filter label="Hips" value={hipFilter} options={bands("hips_band")} onChange={setHipFilter}/><Filter label="Breasts" value={breastFilter} options={bands("breast_band")} onChange={setBreastFilter}/></div><div className="modelGalleryGrid">{filtered.map(v=><button key={v.id} className={`modelVariant${selected?.id===v.id?" active":""}`} onClick={()=>{chooseVariant(v);setGallery(false)}}><ModelImage src={v.image_url} alt={displayBodyName(v.display_name)}/><div><strong>{displayBodyName(v.display_name)}</strong><small>H {v.hips_size} · F {v.fat_thin} · B {v.breasts_size}</small></div></button>)}</div></div></div>}
  <IdentitySourceModal open={identityChoiceOpen} initialMode="create" onClose={()=>setIdentityChoiceOpen(false)} allowClose={true} onConfirm={confirmIdentitySource}/>
   </div>
  </div>
 </div>
}

function Axis({label,value,values,onChange,minLabel,maxLabel}:{label:string;value:number;values:number[];onChange:(v:number)=>void;minLabel:string;maxLabel:string}){
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
   <div><label>{label}</label></div>
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
   <div className="modelAxisEnds"><span>{minLabel}</span><span>{maxLabel}</span></div>
 </div>
}

function BreastAxis({levels,selectedBand,onChange}:{levels:{band:string;value:number}[];selectedBand:string;onChange:(level:{band:string;value:number})=>void}){
 const trackRef=useRef<HTMLDivElement|null>(null);
 const draggingRef=useRef(false);
 const selectedIndex=Math.max(0,levels.findIndex(level=>level.band===selectedBand));
 const safeIndex=selectedIndex>=0?selectedIndex:0;
 const percent=levels.length<=1?0:(safeIndex/(levels.length-1))*100;

 const updateFromClientX=(clientX:number)=>{
   const track=trackRef.current;
   if(!track||!levels.length)return;
   const rect=track.getBoundingClientRect();
   const ratio=Math.min(1,Math.max(0,(clientX-rect.left)/Math.max(rect.width,1)));
   const nextIndex=Math.round(ratio*Math.max(levels.length-1,0));
   const next=levels[nextIndex];
   if(next&&next.band!==selectedBand)onChange(next);
 };

 const onPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
   draggingRef.current=true;
   event.currentTarget.setPointerCapture(event.pointerId);
   updateFromClientX(event.clientX);
 };
 const onPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
   if(draggingRef.current)updateFromClientX(event.clientX);
 };
 const stopDrag=(event:ReactPointerEvent<HTMLDivElement>)=>{
   draggingRef.current=false;
   if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 };
 const onKeyDown=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
   if(!levels.length)return;
   let nextIndex=safeIndex;
   if(event.key==="ArrowRight"||event.key==="ArrowUp")nextIndex=Math.min(levels.length-1,safeIndex+1);
   else if(event.key==="ArrowLeft"||event.key==="ArrowDown")nextIndex=Math.max(0,safeIndex-1);
   else if(event.key==="Home")nextIndex=0;
   else if(event.key==="End")nextIndex=levels.length-1;
   else return;
   event.preventDefault();
   const next=levels[nextIndex];
   if(next)onChange(next);
 };

 const current=levels[safeIndex];
 return <div className="modelAxis">
   <div><label>Breasts</label></div>
   <div
     ref={trackRef}
     className="modelDiscreteSlider"
     role="slider"
     tabIndex={0}
     aria-label="Breasts"
     aria-valuemin={0}
     aria-valuemax={Math.max(0,levels.length-1)}
     aria-valuenow={safeIndex}
     onPointerDown={onPointerDown}
     onPointerMove={onPointerMove}
     onPointerUp={stopDrag}
     onPointerCancel={stopDrag}
     onKeyDown={onKeyDown}
   >
     <div className="modelDiscreteRail"/>
     <div className="modelDiscreteFill" style={{width:`${percent}%`}}/>
     {levels.map((level,i)=><span key={level.band} className={`modelDiscreteTick${i===safeIndex?" active":""}`} style={{left:`${levels.length<=1?0:(i/(levels.length-1))*100}%`}}/>)}
     <span className="modelDiscreteThumb" style={{left:`${percent}%`}}/>
   </div>
   <div className="modelAxisEnds"><span>Small</span><span>Huge</span></div>
 </div>
}
function Filter({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){return <label><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="all">Todos</option>{options.map(x=><option value={x} key={x}>{x.replaceAll("_"," ")}</option>)}</select></label>}
