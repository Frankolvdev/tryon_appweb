STEP 02 — Face Prompt Studio (AppWeb only)

Base exacta: tryon_appweb-main (90).zip

Backend: NO MODIFICADO.
BackOffice: NO MODIFICADO.

Qué agrega:
- Nueva ruta /models/[id]/face
- Paso 02 "Diseña su rostro" con el mismo lenguaje visual de Paso 01.
- Selecciones frontend para heritage, edad, forma facial, ojos, cejas, nariz, labios,
  pómulos, mandíbula, mentón, pecas y cabello.
- Cada opción guarda fragmentos de prompt SDXL específicos.
- Prompt positivo + negative prompt construidos en vivo.
- Triggers incluidos: "4ng3l face, nude"
- Estilo incluido: Tumblr / realism / cute beautiful appearance.
- Draft de selecciones persistido SOLO en localStorage.
- Usa getAiModel existente únicamente para leer nombre/cuerpo seleccionado.
- No ejecuta generación todavía.
- No crea endpoints.
- No toca el pipeline de BackOffice.
- Al guardar correctamente Paso 01, navega a Paso 02.

Blindaje:
- No se modificó la resolución de Body Proportions.
- No se modificó Bubble Butt.
- No se modificaron sliders/scanner/galería.
- Único cambio dentro de model-studio.tsx: navegación a /face después de un guardado exitoso.

Archivos:
- src/lib/face-option-catalog.ts (nuevo)
- src/components/models/face-studio.tsx (nuevo)
- src/app/(app)/models/[id]/face/page.tsx (nuevo)
- src/components/models/model-studio.tsx (navegación mínima)
- src/app/globals.css (estilos aislados face*)
