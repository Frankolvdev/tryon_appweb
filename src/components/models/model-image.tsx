"use client";
import { useState } from "react";

export function ModelImage({
  src,
  alt,
  className = "",
  adaptiveAspect = false,
}:{
  src:string;
  alt:string;
  className?:string;
  adaptiveAspect?:boolean;
}) {
  const [loaded,setLoaded]=useState(false);
  const [aspectRatio,setAspectRatio]=useState<number|null>(null);
  return <div
    className={`modelImageShell ${className}${adaptiveAspect ? " modelImageShellAdaptive" : ""}`}
    style={adaptiveAspect && aspectRatio ? { aspectRatio: `${aspectRatio}` } : undefined}
  >
    <div className={`modelImagePlaceholder${loaded?" isHidden":""}`}><span>✦</span></div>
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={(event)=>{
        const image=event.currentTarget;
        if(adaptiveAspect && image.naturalWidth>0 && image.naturalHeight>0){
          setAspectRatio(image.naturalWidth/image.naturalHeight);
        }
        setLoaded(true);
      }}
      className={loaded?"isLoaded":""}
    />
  </div>;
}
