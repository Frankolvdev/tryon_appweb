"use client";
import Link from "next/link";
import { Activity, ChevronRight } from "lucide-react";
import { useGenerationJobs } from "./generation-jobs-provider";
export function ActiveGenerationJobs(){const {jobs}=useGenerationJobs();if(!jobs.length)return null;return <Link href="/generation" className="activeJobsPill" title="Ver ejecuciones activas"><Activity size={16}/><span>{jobs.length} ejecución{jobs.length===1?"":"es"} activa{jobs.length===1?"":"s"}</span><ChevronRight size={15}/></Link>}
