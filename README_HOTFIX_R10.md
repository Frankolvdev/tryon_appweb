# HOTFIX AppWeb48 R10 — Restore ancestry when retrying generation

Corrige el caso donde, después de generar un cuerpo y pulsar "Modificar e intentar de nuevo", FaceStudio pedía volver a elegir Ascendencia aunque ya estaba seleccionada.

Causa:
- `ancestry` se persistía antes de generar dentro de `draft_json.ancestry`.
- Al reconstruir FaceStudio, `completedSteps` sí se restauraba, pero el estado React `ancestry` quedaba en `null`.
- `generateModel()` valida `ancestry` y por eso volvía a pedirla.

Corrección:
- Restaurar `draft_json.ancestry` al estado `ancestry` al cargar el modelo.
- Guardar también la ascendencia actual cada vez que se usa "Guardar borrador".
- Se conserva el asset completo cuando está disponible para que al volver al nodo Ascendencia se mantengan título/preview/datos del backend.

Archivo modificado:
- src/components/models/face-studio.tsx
