HOTFIX AppWeb C1.6 — Auto-loop + modal viewport + Otro país

Base exacta: tryon_appweb-main (97).zip

CAMBIOS ÚNICOS EN ANCESTRY:
- Auto-loop real en pasos enteros (1 px / 34 ms) mientras selected === null.
- El loop se detiene inmediatamente al seleccionar cualquier ancestry/país.
- Modal "Otro país" renderizado mediante React Portal en document.body:
  queda centrado en el viewport y no depende de transforms/layout del Face Studio.
- Bloquea el scroll del body mientras el modal está abierto.
- Cuando se selecciona un país sin rostro/video:
  * se resalta el card "Otro país"
  * se centra automáticamente
  * el footer muestra la bandera y nombre del país seleccionado
  * el país sigue siendo la selección real para globo/prompt.

BLINDADO / NO TOCADO:
- Body Proportions
- Bubble Butt
- scanner/sliders
- Face Studio fuera de Ancestry
- Backend
- BackOffice
- globe component
- APIs
