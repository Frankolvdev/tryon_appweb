# HOTFIX AppWeb48 Create Model IA Recovery + Existing Face Timeline R9

Cambios:
- Recovery de resultado anterior usa ParticleMorphLoader/scanner visual, sin barra ni porcentaje.
- Texto de recovery: "Cargando resultado anterior…" + "Recuperando la generación guardada".
- ParticleMorphLoader añade props opcionales `statusText`, `statusSubtext`, `hideProgress` sin cambiar el comportamiento por defecto.
- Timeline: un nodo completado siempre es revisitable; un nodo incompleto se puede abrir cuando todos los pasos anteriores requeridos ya están completos.
- Esto permite abrir `Rostro` al cambiar a "Ya tengo un rostro" si Proporciones/Ascendencia/Piel/Ocupación ya estaban completados.

Archivos:
- src/components/models/face-studio.tsx
- src/components/generation/particle-morph-loader.tsx
- src/app/globals.css
