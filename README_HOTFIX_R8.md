# HOTFIX AppWeb47 Create Model IA Recovery / Identity Mode R8

Cambios:
- Evita el warning tardío de body refinement al regresar a Step 01.
- Recovery de generación persistida muestra "Cargando resultado…" sin barra de progreso.
- Una imagen completed restaurada se carga directamente, sin HUD/scanner de generación.
- Si la ejecución restaurada sigue queued/running, conserva scanner/progreso real.
- Restaura identityMode/existingIdentityFile desde modelSetup o formato legacy top-level.
- Step 01 guarda identityMode/existingIdentityFile también top-level para compatibilidad.
- Así "Ya tengo un rostro" usa correctamente EXISTING_IDENTITY_STEPS y oculta los nodos no aplicables.

Archivos:
- src/components/models/face-studio.tsx
- src/components/models/model-studio.tsx
- src/app/globals.css
