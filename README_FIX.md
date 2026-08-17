HOTFIX AppWeb C1.3 — Drag Carousel + Rotatable Globe

Base exacta:
tryon_appweb-main (94).zip

Solo modifica la experiencia nueva de Ancestry.

Cambios:
- Recupera drag horizontal aunque empieces encima de una tarjeta.
- Diferencia click corto (seleccionar) de drag (mover carrusel).
- Conserva flechas, auto-loop, zoom, auto-scroll y card "Otro país".
- Globo 3D/canvas ahora se puede agarrar y rotar libremente en horizontal y vertical.
- Drag del globo no dispara accidentalmente selección de país.
- Click/tap corto sobre un país sigue seleccionándolo.
- Seleccionar ancestry/card sigue moviendo el globo hacia sus coordenadas.

NO TOCA:
- Body Proportions
- Bubble Butt
- scanner/sliders
- Backend
- BackOffice
- otros módulos AppWeb

Reemplazar:
src/components/models/ancestry-experience.tsx
src/components/models/ancestry-globe.tsx
src/components/models/ancestry-experience.module.css
