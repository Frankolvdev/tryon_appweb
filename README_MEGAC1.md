MEGAZIP C1 — AppWeb Ancestry Experience

BASE EXACTA:
tryon_appweb-main (92).zip

ALCANCE ÚNICO:
- Paso 02 /models/[id]/face
- Carrusel de ancestry desde /api/v1/ancestry-media-assets
- Poster estático para no seleccionadas
- Solo la seleccionada monta/carga/reproduce su video
- Video muted + loop + playsInline, sin controles nativos
- Persistencia de selección por modelId en localStorage
- Globo holográfico Canvas sin dependencias externas
- Animación del globo a latitud/longitud del asset
- Bandera/código regional + nombre
- El antiguo selector Heritage se oculta en la vista para no duplicar Ancestry
- Prompt builder acepta ancestryLabel opcional de forma backwards-compatible

BLINDAJE:
- NO modifica src/components/models/model-studio.tsx
- NO modifica Body Proportions
- NO modifica Bubble Butt
- NO modifica scanner/sliders/body storage
- NO modifica Backend
- NO modifica BackOffice
- NO agrega dependencias npm

ARCHIVOS NUEVOS:
src/types/ancestry-media.ts
src/lib/ancestry-media-api.ts
src/components/models/ancestry-globe.tsx
src/components/models/ancestry-experience.tsx
src/components/models/ancestry-experience.module.css

ARCHIVOS EXISTENTES MODIFICADOS SOLO EN PASO 02:
src/components/models/face-studio.tsx
src/lib/face-option-catalog.ts
