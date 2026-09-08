# HOTFIX AppWeb46 — Create Model IA R7

Archivos modificados:
- src/components/models/body-proportions-step.tsx
- src/components/models/face-studio.tsx
- src/app/globals.css

Cambios:
- Skeleton/preload progresivo desde el primer render para previews de Proporciones.
- Slim/Thick usan el mismo shimmer y muestran títulos dinámicos desde backend.
- Previews de Complexion más grandes y en proporción vertical, no cuadrados.
- Se eliminan visualmente las líneas/ticks magnéticos; el snapping de valores se conserva.
- Se elimina por completo "Mejorar proporciones corporales" y su UI de ajuste fino.
- Transición a generación simplificada para evitar reflow/crecimiento extraño del card.
- Cancelled/failed vuelve al modo de configuración centrado, sin body_image_url lateral legacy.
- Completed muestra el resultado centrado con "Modificar e intentar de nuevo" y "Elegir esta" debajo.
- Modificar vuelve al flujo conservando selecciones; una nueva generación repite el mismo procedimiento.

No se modifica Backend, contratos de Generation Modules, pricing, tokens, Modal recovery ni Owner Local.
