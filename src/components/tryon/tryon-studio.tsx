"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageDrop } from "@/components/tryon/image-drop";
import { createTryOn } from "@/lib/tryon-api";
import type { TryOnItemType, TryOnQualityMode } from "@/types/tryon";

export function TryOnStudio() {
  const router = useRouter();
  const [personImage, setPersonImage] = useState<File | null>(null);
  const [itemImage, setItemImage] = useState<File | null>(null);
  const [itemType, setItemType] = useState<TryOnItemType>("clothing");
  const [qualityMode, setQualityMode] = useState<TryOnQualityMode>("standard");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!personImage || !itemImage) { setError("Carga la fotografía de la persona y la imagen del artículo."); return; }
    setBusy(true); setError(null);
    try {
      await createTryOn({ personImage, itemImage, itemType, qualityMode, prompt });
      router.push("/history?created=1");
    } catch (value) { setError(value instanceof Error ? value.message : "No fue posible crear el Try-On."); }
    finally { setBusy(false); }
  }

  return <div className="studioGrid">
    <section className="studioMain">
      <div className="studioIntro"><span className="eyebrow">NUEVA GENERACIÓN</span><h1>Crea un look que se sienta real.</h1><p>Sube una fotografía de la persona y otra del artículo. El procesamiento se realizará con el flujo configurado en la plataforma.</p></div>
      <div className="uploadGrid">
        <ImageDrop label="Foto de la persona" hint="JPG, PNG o WEBP" file={personImage} onChange={setPersonImage}/>
        <ImageDrop label="Prenda o calzado" hint="Imagen clara del artículo" file={itemImage} onChange={setItemImage}/>
      </div>
    </section>
    <aside className="studioControls">
      <div><small>TIPO DE ARTÍCULO</small><div className="segmented"><button className={itemType === "clothing" ? "selected" : ""} onClick={() => setItemType("clothing")}>Ropa</button><button className={itemType === "shoes" ? "selected" : ""} onClick={() => setItemType("shoes")}>Calzado</button></div></div>
      <div><small>CALIDAD</small><div className="segmented"><button className={qualityMode === "standard" ? "selected" : ""} onClick={() => setQualityMode("standard")}>Estándar</button><button className={qualityMode === "high" ? "selected" : ""} onClick={() => setQualityMode("high")}>Alta</button></div></div>
      <label className="promptField"><small>INDICACIONES OPCIONALES</small><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} maxLength={500} placeholder="Ejemplo: conservar la pose y la iluminación original."/><span>{prompt.length}/500</span></label>
      {error && <div className="formError">{error}</div>}
      <button className="primaryButton generateButton" disabled={busy} onClick={submit}>{busy ? "Creando trabajo…" : "Generar Try-On ✦"}</button>
      <p className="studioNote">El consumo real de tokens y los límites son determinados por el backend.</p>
    </aside>
  </div>;
}
