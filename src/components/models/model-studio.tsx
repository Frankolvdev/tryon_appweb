"use client";
import { useEffect,useMemo,useRef,useState,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Grid3X3, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { getAiModel,listBodyVariants,listBubbleButtVariants,setAiModelBody } from "@/lib/ai-model-api";
import type { AiModelProfile,BodyVariant,BubbleButtVariant } from "@/types/ai-model";
import { ModelImage } from "./model-image";

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

export function ModelStudio({modelId}:{modelId:number}){
 const router=useRouter();
 const [model,setModel]=useState<AiModelProfile|null>(null);
 const [items,setItems]=useState<BodyVariant[]>([]);
 const [selected,setSelected]=useState<BodyVariant|null>(null);
 const [axes,setAxes]=useState<AxisState>({hips:0,fat:0,breasts:0,breastBand:""});
 const [gallery,setGallery]=useState(false);
 const [fatFilter,setFatFilter]=useState("all"); const [hipFilter,setHipFilter]=useState("all"); const [breastFilter,setBreastFilter]=useState("all");
 const [saving,setSaving]=useState(false);
 const [transitionKey,setTransitionKey]=useState(0);
 const [loadingTarget,setLoadingTarget]=useState<BodyVariant|null>(null);
 const [scannerFinishing,setScannerFinishing]=useState(false);
 const [bubbleVariants,setBubbleVariants]=useState<BubbleButtVariant[]>([]);
 const [bubbleLoading,setBubbleLoading]=useState(false);
 const bubbleRequestRef=useRef(0);
 const loadRequestRef=useRef(0);
 const decodedUrlsRef=useRef<Set<string>>(new Set());
 const MIN_SCANNER_MS=1300;

 useEffect(()=>{Promise.all([getAiModel(modelId),listBodyVariants("woman")]).then(([m,c])=>{
   setModel(m);setItems(c.items);
   const initial=c.items.find(x=>x.id===m.body_proportion_preset_id)||c.items[0]||null;
   setSelected(initial);
   if(initial)setAxes({hips:initial.hips_size,fat:initial.fat_thin,breasts:initial.breasts_size,breastBand:initial.breast_band||""});
 }).catch(e=>toast.error(e instanceof Error?e.message:"No se pudo cargar el estudio"))},[modelId]);

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
 async function confirm(){if(!selected)return;setSaving(true);try{const m=await setAiModelBody(modelId,selected.id);setModel(m);toast.success("Cuerpo guardado en tu modelo");}catch(e){toast.error(e instanceof Error?e.message:"No se pudo guardar")}finally{setSaving(false)}}
 if(!model)return <div className="modelLoading pageEnter"><span className="spinner"/><p>Preparando el estudio…</p></div>;
 return <div className="modelStudio pageEnter">
  <header className="modelStudioHead"><button onClick={()=>router.push("/models")} className="modelIconBtn"><ArrowLeft size={18}/></button><div><span className="eyebrow">CREATE MODEL IA · CUERPO</span><h1>{model.name}</h1><p>Define la silueta. Tus sliders conservan cada selección y la preview busca la combinación disponible correspondiente.</p></div><button className="modelGalleryBtn" onClick={()=>setGallery(true)}><Grid3X3 size={17}/> Ver todas las variantes</button></header>
  {items.length===0?<div className="modelEmpty"><Sparkles/><h2>Aún no hay cuerpos publicados</h2><p>Genera y guarda variantes desde Body Proportions en el BackOffice. Solo las imágenes listas aparecen aquí.</p></div>:<div className="modelBuilder">
   <section className={`modelPreviewPanel${loadingTarget?" isLoading":""}`}>
     <div className={`modelPreviewHybrid${loadingTarget?" loading":""}${scannerFinishing?" finishing":""}`}>
       {selected&&<div key={transitionKey} className="modelPreviewCurrent"><ModelImage src={selected.image_url} alt={displayBodyName(selected.display_name)} className="modelHeroImage"/></div>}
       {(loadingTarget||scannerFinishing)&&<div className="modelLoadingScanner" aria-hidden="true"><span/></div>}
     </div>
   </section>
   <section className="modelControls"><div className="modelStep"><span>01</span><div><small>PROPORCIONES</small><h2>Esculpe su cuerpo</h2></div></div>
    <Axis label="Hips" value={axes.hips} values={values.hips} minLabel="Small" maxLabel="Huge" onChange={v=>chooseAxis("hips",v)}/><Axis label="Fat / Thin" value={axes.fat} values={values.fat} minLabel="Very Low Fat" maxLabel="Very High Fat" onChange={v=>chooseAxis("fat",v)}/><BreastAxis levels={breastLevels} selectedBand={axes.breastBand} onChange={level=>setAxes(current=>({...current,breastBand:level.band,breasts:level.value}))}/>
     <div className="modelBubblePicker">
      <div className="modelBubbleHeading"><div><small>BUBBLE BUTT</small><strong>Variantes para este cuerpo</strong></div><span>{bubbleLoading?"Cargando…":`${bubbleVariants.length}/4 disponibles`}</span></div>
      <div className="modelBubbleRow">
       {bubbleLoading
        ? [1,2,3,4].map(index=><div key={index} className="modelBubbleCard loading"><div className="modelBubbleLoadingVisual"><div className="modelImagePlaceholder"><span>✦</span></div></div><small>{index===1?"Default":`Variante ${index}`}</small></div>)
        : [1,2,3,4].map(index=>{
          const variant=bubbleVariants.find(item=>item.variant_index===index);
          return variant
           ? <div key={variant.id} className="modelBubbleCard"><ModelImage src={variant.image_url} alt={variant.display_name}/><small>{index===1?"Default":`Variante ${index}`}</small></div>
           : <div key={index} className="modelBubbleCard missing"><div className="modelBubbleMissing">Sin preview</div><small>{index===1?"Default":`Variante ${index}`}</small></div>;
        })}
      </div>
     </div>
<button className="modelConfirm" onClick={confirm} disabled={!selected||saving}><Check size={17}/>{saving?"Guardando…":"Usar este cuerpo"}</button>
   </section></div>}
  {gallery&&<div className="modelModal"><button className="modelModalBackdrop" onClick={()=>setGallery(false)} aria-label="Cerrar"/><div className="modelGallery"><header><div><span className="eyebrow">BIBLIOTECA CORPORAL</span><h2>Todas las variantes</h2><p>{filtered.length} de {items.length} disponibles</p></div><button className="modelIconBtn" onClick={()=>setGallery(false)}><X/></button></header><div className="modelFilters"><Filter label="Grasa" value={fatFilter} options={bands("fat_band")} onChange={setFatFilter}/><Filter label="Hips" value={hipFilter} options={bands("hips_band")} onChange={setHipFilter}/><Filter label="Breasts" value={breastFilter} options={bands("breast_band")} onChange={setBreastFilter}/></div><div className="modelGalleryGrid">{filtered.map(v=><button key={v.id} className={`modelVariant${selected?.id===v.id?" active":""}`} onClick={()=>{chooseVariant(v);setGallery(false)}}><ModelImage src={v.image_url} alt={displayBodyName(v.display_name)}/><div><strong>{displayBodyName(v.display_name)}</strong><small>H {v.hips_size} · F {v.fat_thin} · B {v.breasts_size}</small></div></button>)}</div></div></div>}
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
   <div><label>Breasts</label><output>{current?.value?.toFixed(2).replace(/\.?0+$/,"")??"—"}</output></div>
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
