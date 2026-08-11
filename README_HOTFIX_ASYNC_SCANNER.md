# Hotfix Create Model IA — scanner realmente asíncrono

Base exacta: AppWeb 77.

Cambio aislado:
- El scanner y la descarga comienzan al mismo tiempo.
- Se esperan EN PARALELO:
  1. `new Image() + decode()` de la nueva imagen.
  2. mínimo visual de 1300 ms.
- El cambio ocurre exactamente cuando ambos terminaron:
  `duración total = max(1300 ms, tiempo real de carga)`.

Ejemplos:
- imagen lista en 0.1 s -> termina a los 1.3 s.
- imagen lista en 1.5 s -> termina a los 1.3 s.
- imagen lista en 2.3 s -> termina a los 2.3 s.
- imagen lista en 5.0 s -> termina a los 5.0 s.

El scanner usa movimiento lineal para empezar a desplazarse desde el primer frame.
Se conserva la protección requestId contra cargas viejas.

Blindaje:
- No cambia Breast levels.
- No cambia sliders.
- No cambia FaceSwap/Generation.
- No cambia auth, billing, gallery, backend ni otros módulos.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "fix: synchronize Create Model scanner with real image loading"
git push
