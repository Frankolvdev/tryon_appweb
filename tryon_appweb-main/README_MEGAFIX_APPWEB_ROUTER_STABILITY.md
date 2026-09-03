# MegaFIX AppWeb — estabilidad de navegación y hooks

## Alcance

Este FIX no cambia funcionalidades, diseño, endpoints ni flujos de negocio.

Corrige dos problemas de estabilidad:

1. El menú de Historial navegaba primero a `/history`, una ruta heredada que ejecutaba un redirect de servidor hacia `/generation/history`. Bajo Next.js 16 + React 19 + Turbopack, esa transición doble podía producir de forma intermitente `Rendered more hooks than during the previous render` dentro del Router.
2. Next.js advertía que `scroll-behavior: smooth` estaba activo sin declarar `data-scroll-behavior="smooth"` en `<html>`.

## Cambios

- `src/components/app/app-shell.tsx`
  - Historial apunta directamente a `/generation/history`.
  - Se evita la transición heredada `/history -> /generation/history`.
- `src/app/(app)/history/page.tsx`
  - La ruta heredada renderiza directamente la página canónica en lugar de ejecutar un redirect durante la navegación.
- `src/app/layout.tsx`
  - Se agrega `data-scroll-behavior="smooth"` al elemento `<html>`.

La ruta `/history` se conserva para enlaces antiguos y renderiza el mismo historial sin una transición de redirección intermedia.
