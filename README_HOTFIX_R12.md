# HOTFIX AppWeb50 — Create Model IA — Backend ETA Sync R12

## Objetivo
Blindar la UI de generación para que Backend sea la única autoridad del ETA.

## Cambios
- Se elimina la fórmula de tiempo específica por `owner_local` / `local_docker` en AppWeb.
- AppWeb selecciona el ETA publicado por Backend según `generation_loading_progress_mode`:
  - `backend` -> `loading_backend_estimated_duration_seconds` (fallback a `estimated_duration_seconds`).
  - `elapsed_estimate` -> `estimated_duration_seconds` (fallback al ETA backend).
- Countdown y barra usan exactamente el mismo ETA y el mismo reloj (`started_at` de la ejecución).
- Una ejecución queued sin `started_at` conserva progreso visual mínimo y no consume ETA antes de empezar.
- Con ETA válido, `execution.progress` ya no puede adelantar la barra respecto al countdown.
- `completed` = 100% inmediatamente.
- Mientras siga running y exceda el ETA, la barra queda limitada a 95% hasta confirmación real del Backend.
- Si no existe un ETA válido, se conserva como fallback el `execution.progress` existente.

## Blindaje
No se modifican:
- Backend.
- scanner / ParticleMorphLoader.
- contratos Generation Modules.
- recovery.
- navegación / timelines.
- drafts / identidad / ancestry.
- pricing / tokens / cashboxes.
- Modal / Owner Local recovery.

## Archivo modificado
- `src/components/models/face-studio.tsx`
