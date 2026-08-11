# Create Model IA — hotfix blindado V2

## Create Model IA
- Elimina el texto `Preview más cercana disponible`.
- Nunca muestra `Ass` en los nombres visibles de variantes; se transforma solo visualmente a `Hips`.
- Hips / Fat-Thin / Breasts conservan su selección independiente.
- Slider propio con Pointer Events + pointer capture. No añade dependencias npm.
- El slider solo emite cuando cruza un punto real y la preview se resuelve con debounce de 55 ms.
- Nueva transición vertical tipo scanner: la línea baja rápidamente mientras revela la imagen.

## FaceSwap / Generation Modules
Se restauran EXCLUSIVAMENTE desde `tryon_appweb-main (72).zip`, el primer AppWeb enviado hoy:
- components/generation/*
- lib/generation-api.ts
- lib/generation-errors.ts
- types/generation.ts
- rutas generation y try-on

No se usó una versión antigua del repositorio.

## Blindaje
No se modifican:
- auth
- billing
- gallery
- legal
- account
- layout
- backend
- storage
- otros módulos AppWeb

Aplicar y ejecutar:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "fix: harden Create Model sliders scanner and restore FaceSwap module"
git push
