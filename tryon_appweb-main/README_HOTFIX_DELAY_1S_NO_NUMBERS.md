# Hotfix Create Model IA — 1s mínimo + sin números

Base exacta: AppWeb 80.

Cambios SOLO en Create Model IA:
- Delay/tiempo mínimo del scanner: 1300 ms -> 1000 ms.
- Se eliminan los valores numéricos visibles de Hips, Fat/Thin y Breasts.
- Se conservan las etiquetas de extremos:
  - Hips: Small ↔ Huge
  - Fat / Thin: Very Low Fat ↔ Very High Fat
  - Breasts: Small ↔ Huge
- Los valores numéricos siguen existiendo internamente para resolver variantes; solo dejan de mostrarse al usuario.

Blindaje:
- No cambia número de steps.
- No cambia breast_band.
- No cambia sliders ni cursor.
- No cambia scanner/loading salvo el mínimo a 1 segundo.
- No cambia FaceSwap, Generation, auth, billing, gallery, backend ni otros módulos.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "style: hide body slider values and set scanner minimum to one second"
git push
