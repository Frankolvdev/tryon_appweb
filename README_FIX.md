HOTFIX AppWeb C1.4 — click/drag/loop Ancestry

Base exacta:
tryon_appweb-main (95).zip

Cambios ÚNICOS en la experiencia nueva de Ancestry:
- Click normal sobre una modelo vuelve a seleccionar correctamente.
- Al seleccionar una modelo, el globo recibe esa selección y anima al país.
- El pointer capture del carrusel solo se activa después de detectar un arrastre real (>6px).
- Arrastrar desde encima de una tarjeta sigue funcionando.
- Un drag no dispara una selección accidental.
- Seleccionar país desde el globo ahora marca explícitamente una selección de usuario y detiene el loop.
- El auto-loop continúa mientras NO haya selección del usuario; no se detiene solo por hover.
- El auto-loop se pausa durante drag/modal y queda detenido después de seleccionar.
- Cursor del track vacío: grab.
- Cursor sobre card seleccionable: flecha normal.
- Durante drag: grabbing.
- En globo: grab sobre superficie; flecha normal sobre un país; grabbing al rotar.

NO modifica:
- Body Proportions
- Bubble Butt
- scanner/sliders
- face prompt controls
- Backend
- BackOffice
- APIs

Reemplazar:
src/components/models/ancestry-experience.tsx
src/components/models/ancestry-globe.tsx
src/components/models/ancestry-experience.module.css
