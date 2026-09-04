"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Check, Upload, X } from "lucide-react";
import { uploadLibraryFileWithProgress, type LibraryFile } from "@/lib/user-library-api";

export type IdentitySourceMode = "create" | "existing";
export type ExistingIdentityFile = Pick<LibraryFile, "id" | "filename" | "content_type" | "url">;

export function IdentitySourceModal({
  open,
  initialMode = "create",
  existingFile = null,
  onClose,
  onConfirm,
  allowClose = true,
}: {
  open: boolean;
  initialMode?: IdentitySourceMode;
  existingFile?: ExistingIdentityFile | null;
  onClose: () => void;
  onConfirm: (mode: IdentitySourceMode, file: ExistingIdentityFile | null) => Promise<void> | void;
  allowClose?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<IdentitySourceMode>(initialMode);
  const [file, setFile] = useState<ExistingIdentityFile | null>(existingFile);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setFile(existingFile);
    setError("");
    setProgress(existingFile ? 100 : 0);
  }, [open, initialMode, existingFile]);

  if (!open) return null;

  async function chooseFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) {
      setError("Selecciona una imagen válida para el rostro.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(1);
    try {
      const uploaded = await uploadLibraryFileWithProgress(candidate, setProgress);
      setFile({ id: uploaded.id, filename: uploaded.filename, content_type: uploaded.content_type, url: uploaded.url });
      setProgress(100);
    } catch (uploadError) {
      setProgress(0);
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir el rostro.");
    } finally {
      setUploading(false);
    }
  }

  async function confirm() {
    if (mode === "existing" && !file) {
      setError("Sube un rostro antes de confirmar esta opción.");
      return;
    }
    setConfirming(true);
    setError("");
    try { await onConfirm(mode, mode === "existing" ? file : null); }
    catch (confirmError) { setError(confirmError instanceof Error ? confirmError.message : "No se pudo guardar la selección."); }
    finally { setConfirming(false); }
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!uploading) void chooseFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="modelModal identitySourceModal" role="dialog" aria-modal="true" aria-label="Elige cómo crear la identidad">
      <button className="modelModalBackdrop" onClick={() => allowClose && onClose()} aria-label="Cerrar" />
      <section className="identitySourcePanel">
        {allowClose && <button type="button" className="identitySourceClose" onClick={onClose} aria-label="Cerrar"><X size={18}/></button>}
        <div className="identitySourceHeading">
          <span>IDENTIDAD · PASO 02</span>
          <h2>¿Cómo quieres crear su rostro?</h2>
          <p>Puedes diseñar una identidad nueva con IA o partir de un rostro que ya tienes autorizado para usar.</p>
        </div>

        <div className="identitySourceChoices">
          <button type="button" className={`identitySourceChoice${mode === "create" ? " active" : ""}`} onClick={() => { setMode("create"); setError(""); }}>
            <img src="/identity-source/create-identity.svg" alt="Representación tecnológica de una identidad en construcción" />
            <span><b>Crear identidad</b><small>Diseña ojos, cejas, labios, cabello y demás rasgos con IA.</small></span>
            {mode === "create" && <i><Check size={13}/></i>}
          </button>
          <button type="button" className={`identitySourceChoice${mode === "existing" ? " active" : ""}`} onClick={() => { setMode("existing"); setError(""); }}>
            <img src="/identity-source/existing-face.svg" alt="Representación tecnológica de un rostro existente" />
            <span><b>Ya tengo un rostro de identidad</b><small>Sube una imagen frontal y úsala como referencia de identidad.</small></span>
            {mode === "existing" && <i><Check size={13}/></i>}
          </button>
        </div>

        {mode === "existing" && (
          <div className="identitySourceUploadArea">
            <button type="button" className={`identityDropzone${file ? " hasFile" : ""}`} onClick={() => !uploading && inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} disabled={uploading}>
              {file ? <img src={file.url} alt="Rostro de identidad seleccionado" /> : <span className="identityDropIcon"><Upload size={25}/></span>}
              <div>
                <strong>{file ? file.filename : "Arrastra aquí el rostro o haz clic para elegirlo"}</strong>
                <small>{file ? "Puedes reemplazar esta imagen antes de confirmar." : "JPG, PNG o WEBP · usa una imagen clara y frontal"}</small>
              </div>
            </button>
            <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={(event) => void chooseFile(event.target.files?.[0])}/>
            {(uploading || progress > 0) && (
              <div className="identityUploadProgress" aria-live="polite">
                <div><span style={{ width: `${progress}%` }}/></div><b>{progress}%</b>
              </div>
            )}
            <p className="identityRightsNotice">Usa únicamente rostros propios o imágenes para las que tengas consentimiento y derechos suficientes. No subas la identidad de otra persona sin autorización.</p>
          </div>
        )}

        {error && <div className="identitySourceError">{error}</div>}
        <button type="button" className="modelConfirm identitySourceConfirm" onClick={() => void confirm()} disabled={uploading || confirming || (mode === "existing" && !file)}>
          <Check size={17}/>{confirming ? "Guardando…" : mode === "create" ? "Crear identidad" : "Confirmar este rostro"}
        </button>
      </section>
    </div>
  );
}
