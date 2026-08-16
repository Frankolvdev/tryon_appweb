MEGAZIP C1.1 — AppWeb Ancestry Experience UX

BASE: tryon_appweb-main (93)(1).zip

BLINDAJE
- NO modifica model-studio.tsx.
- NO modifica Body Proportions, Bubble Butt, scanner ni sliders.
- NO modifica Backend.
- NO modifica BackOffice.
- Solo reemplaza/añade archivos del Paso 02 Ancestry.

MEJORAS
- Tarjeta seleccionada con zoom/halo mucho más fuerte.
- Padding/z-index/isolation corregidos para que el zoom no quede cortado.
- Carrusel se desplaza lentamente de forma automática y rebota al llegar al extremo.
- Auto-scroll se pausa al hover, drag o modal.
- Carrusel draggable con pointer/manita (grab/grabbing).
- Globo dibuja contornos reales de países/continentes.
- Países del globo son clicables.
- Clic en un país selecciona su ancestry; si tiene video publicado usa el asset real.
- Países sin video también son seleccionables mediante asset sintético frontend.
- Última tarjeta: avatar/sombra "Otro país".
- Modal buscable con 249 países y marca VIDEO cuando existe uno publicado.
- Persistencia ahora usa country code estable para soportar países sin asset.

ARCHIVOS
src/components/models/ancestry-experience.tsx
src/components/models/ancestry-globe.tsx
src/components/models/ancestry-experience.module.css
src/lib/face-country-catalog.ts
public/data/world-countries.geojson
