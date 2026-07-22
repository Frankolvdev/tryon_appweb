"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getGenerationExecution, listActiveGenerationExecutions } from "@/lib/generation-api";
import type { GenerationExecution } from "@/types/generation";

type JobsContextValue={jobs:GenerationExecution[];refresh:()=>Promise<void>;track:(job:GenerationExecution)=>void;getForModule:(moduleId:number)=>GenerationExecution|null};
const JobsContext=createContext<JobsContextValue|null>(null);
const ACTIVE=new Set(["queued","running"]);
export function GenerationJobsProvider({children}:{children:ReactNode}){
 const [jobs,setJobs]=useState<GenerationExecution[]>([]); const mounted=useRef(true);
 const refresh=useCallback(async()=>{try{const r=await listActiveGenerationExecutions();if(mounted.current)setJobs(r.items)}catch{}},[]);
 const track=useCallback((job:GenerationExecution)=>setJobs(prev=>[job,...prev.filter(x=>x.id!==job.id)].filter(x=>ACTIVE.has(x.status))),[]);
 useEffect(()=>{mounted.current=true;void refresh();return()=>{mounted.current=false}},[refresh]);
 useEffect(()=>{const timer=window.setInterval(async()=>{const snapshot=jobs.filter(x=>ACTIVE.has(x.status));if(!snapshot.length){void refresh();return}const next=await Promise.all(snapshot.map(async j=>{try{return await getGenerationExecution(j.id)}catch{return j}}));if(mounted.current)setJobs(next.filter(x=>ACTIVE.has(x.status)))},1500);return()=>window.clearInterval(timer)},[jobs,refresh]);
 const value=useMemo(()=>({jobs,refresh,track,getForModule:(moduleId:number)=>jobs.find(x=>x.module_id===moduleId)??null}),[jobs,refresh,track]);
 return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}
export function useGenerationJobs(){const v=useContext(JobsContext);if(!v)throw new Error("useGenerationJobs must be used inside GenerationJobsProvider");return v}
