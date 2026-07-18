"use client";

import { useEffect, useId, useState } from "react";

type Props = { label: string; hint: string; file: File | null; onChange: (file: File | null) => void };

export function ImageDrop({ label, hint, file, onChange }: Props) {
  const id = useId();
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <label className={`imageDrop${preview ? " hasImage" : ""}`} htmlFor={id}>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    {preview ? <><img src={preview} alt="Vista previa" /><button type="button" onClick={(e) => { e.preventDefault(); onChange(null); }}>Cambiar</button></> : <div><span>＋</span><strong>{label}</strong><small>{hint}</small></div>}
  </label>;
}
