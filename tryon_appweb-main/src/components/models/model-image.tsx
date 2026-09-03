"use client";
import { useState } from "react";
export function ModelImage({src,alt,className=""}:{src:string;alt:string;className?:string}){const [loaded,setLoaded]=useState(false);return <div className={`modelImageShell ${className}`}><div className={`modelImagePlaceholder${loaded?" isHidden":""}`}><span>✦</span></div><img src={src} alt={alt} loading="lazy" decoding="async" onLoad={()=>setLoaded(true)} className={loaded?"isLoaded":""}/></div>}
