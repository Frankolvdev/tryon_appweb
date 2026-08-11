# HOTFIX Create Model IA — restauración blindada

Base usada: AppWeb 73 exacto.

Cambios permitidos:
1. `app-shell.tsx`: elimina únicamente `WandSparkles` y reutiliza `Sparkles`, icono que ya existía en el shell estable.
2. `globals.css`: se reconstruye desde el `globals.css` exacto de AppWeb 73 y solo se anexan las reglas de transición del preview.
3. `model-studio.tsx`: sliders desacoplados por eje:
   - Hips no cambia al mover Breasts.
   - Fat no cambia al mover otro eje.
   - Busca combinación exacta primero.
   - Si falta, muestra la imagen más cercana sin mover los sliders.
   - Seleccionar desde galería sí actualiza los 3 valores.
   - transición tecnológica corta.

No toca:
- auth
- generation
- gallery
- billing
- legal gates
- layout
- API
- backend
- otros estilos existentes

Después de aplicar, detener `npm run dev` y ejecutar:

Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

En el navegador hacer Ctrl+Shift+R una vez para invalidar los chunks viejos de Turbopack.

Git:
git add .
git commit -m "fix: restore app shell styles and stabilize Create Model IA sliders"
git push
