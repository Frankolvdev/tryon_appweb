# Hotfix Create Model IA — Breast levels + slower scanner

Cambios aislados en AppWeb 74:

- Breast ya NO usa todos los `breasts_size` numéricos distintos.
- Los steps se construyen desde los `breast_band` reales existentes.
- Hoy, si solo existen Small / Medium / Big / Huge, el slider muestra exactamente 4 posiciones.
- Cuando aparezcan niveles intermedios en el catálogo, se agregan automáticamente y se ordenan por su valor real medio.
- Cambiar Hips/Fat conserva el breast_band elegido.
- El scanner pasa de ~0.28 s a ~1.12 s (4x más lento).
- Cursor del slider: `grab` / `grabbing` (manita).
- No se agregan paquetes npm ni dependencias.
- No se modifica backend, FaceSwap, auth, billing, gallery, generation ni otros módulos.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "fix: use real breast levels and slow Create Model scanner"
git push
