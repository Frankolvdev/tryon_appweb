# HOTFIX AppWeb49 Create Model IA — ETA / progreso R11

Aplicar sobre AppWeb49 reemplazando archivos.

Cambios:
- Botón de resultado: `Modificar` únicamente; se elimina "Modificar e intentar de nuevo" y el subtítulo "Conserva todas tus selecciones".
- Proveedores remotos: ETA countdown y porcentaje comparten el mismo reloj visual desde el inicio de la ejecución. El progreso queda limitado a 95% hasta que Backend confirme `completed`.
- Evita que `started_at/created_at` del backend haga saltar el porcentaje mientras el countdown usa otra estimación.
- `owner_local` y `local_docker`: conservan tratamiento diferenciado; el progreso mostrado usa `execution.progress` del backend/proveedor en lugar de la simulación ETA remota.
- Para local, si `generation_loading_progress_mode=backend`, usa `loading_backend_estimated_duration_seconds`; si no, usa la estimación normal disponible.
- No cambia Backend, contratos, pricing, tokens ni recovery.

Archivos:
- src/components/models/face-studio.tsx
