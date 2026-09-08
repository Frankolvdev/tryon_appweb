"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { getAiModel, listBodyVariants, listBubbleButtVariants, saveAiModelDraft, setAiModelBody } from "@/lib/ai-model-api";
import { listModelGenerationAssets } from "@/lib/model-generation-assets-api";
import type { BodyVariant } from "@/types/ai-model";
import type { ModelGenerationAsset, ModelGenerationToolKey } from "@/types/model-generation-asset";

type BodyControlState={hips:number;buttSize:number;breasts:number;height:number;bubbleButt:number;waist:number;complexion:"slim"|"thick"};
const DEFAULT_BODY:BodyControlState={hips:0,buttSize:0,breasts:-5,height:0,bubbleButt:0,waist:0,complexion:"slim"};
const HIP_LABELS=["Small Hips","Medium Hips","Big Hips","Huge Hips"] as const;
const BODY_TOOLS:ModelGenerationToolKey[]=["hips","butt_size","breasts","height","bubble_butt","waist","complexion"];
let BODY_VARIANTS_CACHE:BodyVariant[]|null=null;
let BODY_VARIANTS_PROMISE:Promise<BodyVariant[]>|null=null;
let BODY_ASSETS_CACHE:Record<string,ModelGenerationAsset[]>|null=null;
let BODY_ASSETS_PROMISE:Promise<Record<string,ModelGenerationAsset[]>>|null=null;
const PRELOADED_PREVIEW_URLS=new Set<string>();
function ordered(items:ModelGenerationAsset[]){return [...items].sort((a,b)=>(a.position??9999)-(b.position??9999)||a.sort_order-b.sort_order||a.id-b.id)}
function nearestAsset(items:ModelGenerationAsset[],ratio:number){const rows=ordered(items);if(!rows.length)return null;return rows[Math.round(Math.max(0,Math.min(1,ratio))*(rows.length-1))]??rows[0]}
function loadBodyVariants(){
 if(BODY_VARIANTS_CACHE)return Promise.resolve(BODY_VARIANTS_CACHE);
 if(!BODY_VARIANTS_PROMISE)BODY_VARIANTS_PROMISE=listBodyVariants("woman").then(r=>(BODY_VARIANTS_CACHE=r.items,r.items)).finally(()=>{BODY_VARIANTS_PROMISE=null});
 return BODY_VARIANTS_PROMISE;
}
function loadBodyAssets(){
 if(BODY_ASSETS_CACHE)return Promise.resolve(BODY_ASSETS_CACHE);
 if(!BODY_ASSETS_PROMISE)BODY_ASSETS_PROMISE=Promise.all(BODY_TOOLS.map(t=>listModelGenerationAssets(t).catch(()=>({items:[],total:0})))).then(catalogs=>{
  const map:Record<string,ModelGenerationAsset[]>={};BODY_TOOLS.forEach((t,i)=>map[t]=ordered(catalogs[i].items));BODY_ASSETS_CACHE=map;return map;
 }).finally(()=>{BODY_ASSETS_PROMISE=null});
 return BODY_ASSETS_PROMISE;
}
function preloadPreviewUrl(url:string|null|undefined){
 if(!url||PRELOADED_PREVIEW_URLS.has(url)||typeof window==="undefined")return;
 PRELOADED_PREVIEW_URLS.add(url);
 const img=new Image();img.src=url;
}
export function preloadBodyProportionsStep(bodyDraft?:Partial<BodyControlState>|null){
 void Promise.all([loadBodyVariants(),loadBodyAssets()]).then(([,map])=>{
  const body={...DEFAULT_BODY,...(bodyDraft||{})};
  const previews=[
   nearestAsset(map.hips??[],Math.max(0,Math.min(3,Math.round(Number(body.hips)||0)))/3),
   nearestAsset(map.butt_size??[],Number(body.buttSize||0)/7),
   nearestAsset(map.breasts??[],(Number(body.breasts||0)+5)/10),
   nearestAsset(map.height??[],(Number(body.height||0)+5)/10),
   nearestAsset(map.bubble_butt??[],Number(body.bubbleButt||0)/.7),
   nearestAsset(map.waist??[],(Number(body.waist||0)+3)/6),
   (map.complexion??[]).find(x=>(x.title||x.asset_key).toLowerCase().includes(body.complexion||"slim"))??nearestAsset(map.complexion??[],body.complexion==="thick"?1:0),
  ];
  previews.forEach(asset=>preloadPreviewUrl(asset?.poster_url||(!asset?.poster_url?asset?.video_url:null)));
 }).catch(()=>undefined);
}

export function BodyProportionsStep({modelId,onComplete,onDraftChange}:{modelId:number;onComplete:()=>void;onDraftChange?:(body:BodyControlState,mode:"fit"|"curvy",meta:{heightTouched:boolean;hipsTouched:boolean;breastsTouched:boolean})=>void}){
 const [bodyVariants,setBodyVariants]=useState<BodyVariant[]>(()=>BODY_VARIANTS_CACHE??[]);
 const [assets,setAssets]=useState<Record<string,ModelGenerationAsset[]>>(()=>BODY_ASSETS_CACHE??{});
 const [body,setBody]=useState(DEFAULT_BODY);
 const [saving,setSaving]=useState(false);
 const [heightTouched,setHeightTouched]=useState(false);
 const [hipsTouched,setHipsTouched]=useState(false);
 const [breastsTouched,setBreastsTouched]=useState(false);
 const [catalogLoading,setCatalogLoading]=useState(()=>!(BODY_VARIANTS_CACHE&&BODY_ASSETS_CACHE));
 const onDraftChangeRef=useRef(onDraftChange);
 useEffect(()=>{onDraftChangeRef.current=onDraftChange},[onDraftChange]);
 useEffect(()=>{onDraftChangeRef.current?.(body,"fit",{heightTouched,hipsTouched,breastsTouched})},[body,heightTouched,hipsTouched,breastsTouched]);
 useEffect(()=>{
  let alive=true;
  setCatalogLoading(true);
  Promise.all([getAiModel(modelId),loadBodyVariants(),loadBodyAssets()])
   .then(([m,variants,map])=>{
    if(!alive)return;
    setBodyVariants(variants);
    setAssets(map);
    const d=m.draft_json as any;
    if(d?.bodyProportions){
      const savedHeightTouched=d?.bodyProportionsMeta?.heightTouched===true;
      const savedHipsTouched=d?.bodyProportionsMeta?.hipsTouched===true;
      const savedBreastsTouched=d?.bodyProportionsMeta?.breastsTouched===true;
      const restored={...DEFAULT_BODY,...d.bodyProportions};
      restored.hips=Math.max(0,Math.min(3,Math.round(Number(restored.hips)||0)));
      // Legacy drafts may contain previous defaults even when the user never
      // moved these controls. Only preserve a stored value after the control
      // has explicitly been touched under the current defaults.
      if(!savedHeightTouched)restored.height=0;
      if(!savedHipsTouched)restored.hips=0;
      if(!savedBreastsTouched)restored.breasts=-5;
      setHeightTouched(savedHeightTouched);
      setHipsTouched(savedHipsTouched);
      setBreastsTouched(savedBreastsTouched);
      setBody(restored);
    } else {
      setHeightTouched(false);
      setHipsTouched(false);
      setBreastsTouched(false);
      setBody(DEFAULT_BODY);
    }
   })
   .catch(e=>{if(alive)toast.error(e instanceof Error?e.message:"No se pudieron cargar las proporciones")})
   .finally(()=>{if(alive)setCatalogLoading(false)});
  return()=>{alive=false};
 },[modelId]);
 const preview=useMemo(()=>({hips:nearestAsset(assets.hips??[],body.hips/3),butt_size:nearestAsset(assets.butt_size??[],body.buttSize/7),breasts:nearestAsset(assets.breasts??[],(body.breasts+5)/10),height:nearestAsset(assets.height??[],(body.height+5)/10),bubble_butt:nearestAsset(assets.bubble_butt??[],body.bubbleButt/.7),waist:nearestAsset(assets.waist??[],(body.waist+3)/6),complexion:(assets.complexion??[]).find(x=>(x.title||x.asset_key).toLowerCase().includes(body.complexion))??nearestAsset(assets.complexion??[],body.complexion==="slim"?0:1)}),[assets,body]);
 const set=<K extends keyof BodyControlState>(k:K,v:BodyControlState[K])=>setBody(s=>({...s,[k]:v}));
 async function confirm(){if(!bodyVariants.length){toast.error("No hay presets corporales base disponibles.");return}setSaving(true);try{const hipsVals=[...new Set(bodyVariants.map(x=>x.hips_size))].sort((a,b)=>a-b);const breastVals=[...new Set(bodyVariants.map(x=>x.breasts_size))].sort((a,b)=>a-b);const targetHip=hipsVals[Math.round((body.hips/3)*Math.max(hipsVals.length-1,0))]??hipsVals[0];const targetBreast=breastVals[Math.round(((body.breasts+5)/10)*Math.max(breastVals.length-1,0))]??breastVals[0];const preset=[...bodyVariants].sort((a,b)=>Math.abs(a.hips_size-targetHip)+Math.abs(a.breasts_size-targetBreast))[0];if(!preset)throw new Error("No se pudo resolver el preset corporal base.");const bubbles=await listBubbleButtVariants(preset.id);const bubble=bubbles.items[Math.round((body.bubbleButt/.7)*Math.max(bubbles.items.length-1,0))]??bubbles.items[0];if(!bubble)throw new Error("Este cuerpo no tiene Butt Elevation disponible.");const m=await getAiModel(modelId);const current=(m.draft_json&&typeof m.draft_json==="object")?m.draft_json:{};await saveAiModelDraft(modelId,{...current,bodyProportions:body,bodyProportionsMeta:{...(current as any).bodyProportionsMeta,heightTouched,hipsTouched,breastsTouched},bodyMode:"fit"},m.name);await setAiModelBody(modelId,preset.id,bubble.id);onComplete()}catch(e){toast.error(e instanceof Error?e.message:"No se pudieron guardar las proporciones")}finally{setSaving(false)}}
 const complexionAsset=(value:"slim"|"thick")=>(assets.complexion??[]).find(x=>(x.title||x.asset_key).toLowerCase().includes(value))??nearestAsset(assets.complexion??[],value==="slim"?0:1);
 const valueLabel=(value:number)=>Number(value.toFixed(1)).toFixed(1);
 return <div className="modelEmbeddedBodyStep">
  <div className="modelV2Complexion"><div>{(["slim","thick"] as const).map(v=>{const asset=complexionAsset(v);const active=body.complexion===v;return <button key={v} className={active?"active":""} onClick={()=>set("complexion",v)}>{asset?<AssetPreview asset={asset} portrait/>:catalogLoading?<PreviewSkeleton portrait/>:<span className="modelV2AssetPreview modelV2AssetPreviewMissing"/>}<b>{asset?.title?.trim()||asset?.asset_key?.trim()||(v==="slim"?"Slim":"Thick")}</b>{active?<i className="modelComplexionCheck"><Check size={13}/></i>:null}</button>})}</div></div>
  <div className="modelV2ControlsGrid">
   <Control loading={catalogLoading} label="Hips" value={body.hips} display={HIP_LABELS[Math.max(0,Math.min(3,Math.round(body.hips)))]} min={0} max={3} step={1} left="Small" right="Huge" asset={preview.hips} onChange={v=>{setHipsTouched(true);set("hips",Math.round(v))}}/>
   <Control loading={catalogLoading} label="Butt Size" value={body.buttSize} display={valueLabel(body.buttSize)} min={0} max={7} step={0.2} left="Small" right="Huge" asset={preview.butt_size} onChange={v=>set("buttSize",v)}/>
   <Control loading={catalogLoading} label="Breasts" value={body.breasts} display={valueLabel(body.breasts)} min={-5} max={5} step={0.2} left="Small" right="Huge" asset={preview.breasts} onChange={v=>{setBreastsTouched(true);set("breasts",v)}}/>
   <Control loading={catalogLoading} label="Height" value={body.height} display={valueLabel(body.height)} min={-5} max={5} step={0.2} left="Very short" right="Very tall" asset={preview.height} onChange={v=>{setHeightTouched(true);set("height",v)}}/>
   <Control loading={catalogLoading} label="Bubble Butt" value={body.bubbleButt} display={valueLabel(body.bubbleButt)} min={0} max={.7} step={.2} left="Low lift" right="High lift" asset={preview.bubble_butt} onChange={v=>set("bubbleButt",Number(v.toFixed(1)))}/>
   <Control loading={catalogLoading} label="Waist" value={body.waist} display={valueLabel(body.waist)} min={-3} max={3} step={0.2} left="Very narrow" right="Very wide" asset={preview.waist} onChange={v=>set("waist",v)}/>
  </div>
  <div className="faceStepConfirmRow"><button type="button" className="faceChooseButton" onClick={confirm} disabled={saving||catalogLoading}><Check size={17}/>{saving?"Guardando…":"Elegir"}</button></div>
 </div>
}
function PreviewSkeleton({portrait=false}:{portrait?:boolean}){return <span className={`modelV2AssetPreview modelV2AssetSkeleton${portrait?" modelV2AssetPreviewPortrait":""}`} aria-hidden="true"/>}
function AssetPreview({asset,portrait=false}:{asset:ModelGenerationAsset;portrait?:boolean}){
 const [ready,setReady]=useState(false); const src=asset.poster_url||asset.video_url;
 if(!src)return null;
 return <span className={`modelV2AssetPreview${portrait?" modelV2AssetPreviewPortrait":""}`}>
  {!ready&&<span className="modelV2AssetSkeleton" aria-hidden="true"/>}
  {asset.video_url&&!asset.poster_url?<video className={ready?"isReady":""} src={asset.video_url} muted loop autoPlay playsInline preload="metadata" onLoadedData={()=>setReady(true)} onError={()=>setReady(true)}/>:<img className={ready?"isReady":""} src={src} alt="" loading="eager" onLoad={()=>setReady(true)} onError={()=>setReady(true)}/>}
 </span>
}
function Control({label,value,display,min,max,step,left,right,asset,loading,onChange}:{label:string;value:number;display:string;min:number;max:number;step:number;left:string;right:string;asset:ModelGenerationAsset|null;loading:boolean;onChange:(v:number)=>void}){return <div className="modelV2Control">{asset?<AssetPreview asset={asset}/>:loading?<PreviewSkeleton/>:null}<div className="modelV2ControlMain"><div className="modelV2ControlHead"><strong>{label}</strong><output>{display}</output></div><Slider value={value} min={min} max={max} step={step} onChange={onChange}/><div className="modelAxisEnds"><span>{left}</span><span>{right}</span></div></div></div>}
function Slider({value,min,max,step,onChange}:{value:number;min:number;max:number;step:number;onChange:(v:number)=>void}){const ref=useRef<HTMLDivElement|null>(null),drag=useRef(false);const percent=((value-min)/Math.max(max-min,step))*100;const snapPoints=useMemo(()=>{const out:number[]=[];for(let v=min;v<=max+1e-9;v+=step)out.push(Number(v.toFixed(4)));if(Math.abs((out[out.length-1]??min)-max)>1e-6)out.push(max);return out},[min,max,step]);const update=(x:number)=>{const el=ref.current;if(!el)return;const r=el.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(x-r.left)/Math.max(r.width,1))),raw=min+ratio*(max-min);let next=snapPoints[0]??min;for(const point of snapPoints){if(Math.abs(point-raw)<Math.abs(next-raw))next=point}onChange(Number(next.toFixed(4)))};return <div ref={ref} className="modelDiscreteSlider" role="slider" tabIndex={0} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} onPointerDown={(e:ReactPointerEvent<HTMLDivElement>)=>{drag.current=true;e.currentTarget.setPointerCapture(e.pointerId);update(e.clientX)}} onPointerMove={(e:ReactPointerEvent<HTMLDivElement>)=>{if(drag.current)update(e.clientX)}} onPointerUp={e=>{drag.current=false;e.currentTarget.releasePointerCapture(e.pointerId)}}><div className="modelDiscreteRail"/><div className="modelDiscreteFill" style={{width:`${percent}%`}}/><span className="modelDiscreteThumb" style={{left:`${percent}%`}}/></div>}
