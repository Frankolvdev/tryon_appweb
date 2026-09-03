# Hotfix Create Model IA — Breast steps + minimum scanner

Base exacta: AppWeb 76.

Cambios SOLO en Create Model IA:
- Breast usa únicamente los `breast_band` realmente existentes.
- Si hoy existen Small / Medium / Big / Huge, hay exactamente 4 steps.
- Si luego agregas intermedios, aparecerán automáticamente como nuevos steps.
- El resolver prioriza mantener el breast_band seleccionado aunque el breasts_size interno cambie por compensaciones.
- Loading híbrido conserva `new Image() + decode()`.
- Cada cambio real de imagen mantiene blur + scanner por un mínimo de 2 segundos.
- Si R2/S3/local tarda más de 2 segundos, espera el tiempo real de carga.
- Imágenes ya cacheadas también muestran el scanner mínimo de 2 segundos.
- Cursor del slider: grab/grabbing.

No se modifica FaceSwap, Generation, auth, billing, gallery, backend ni otros módulos.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "fix: restore real breast levels and minimum Create Model scanner"
git push
