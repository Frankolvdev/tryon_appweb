# Hotfix Create Model IA — etiquetas de extremos + cursor

Base exacta: AppWeb 79.

Cambios SOLO visuales en sliders:
- Hips: Small ↔ Huge.
- Fat / Thin: Very Low Fat ↔ Very High Fat.
- Breasts: Small ↔ Huge.
- Los puntos intermedios siguen sin texto.
- Cursor cambia de grab/grabbing a flecha normal (`default`).

No cambia:
- número de steps;
- breast_band;
- lógica de selección;
- scanner/loading;
- delay mínimo 1.3 s;
- FaceSwap/Generation;
- auth, billing, gallery, backend ni otros módulos.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "style: label Create Model slider endpoints"
git push
