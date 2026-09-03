# Hotfix BackOffice — Restaurar valores por tarjeta

Base exacta: tryon_backoffice-main - 2026-08-11T140301.707.zip

Restaura únicamente el botón:
`Restaurar valores`

Comportamiento:
- llama al endpoint backend YA EXISTENTE:
  POST /presets/{id}/synchronize-rules
- olvida los valores guardados individualmente de esa categoría base;
- recalcula Hips / Fat-Thin / Breasts / valores derivados desde la configuración global actual;
- guarda esos valores en BD;
- conserva la preview/storage existente;
- marca el preset como draft para indicar que debe regenerarse si quieres que la imagen corresponda a los nuevos valores.

No modifica backend.
No modifica generación por grupo, workflow, mappings, almacenamiento, Create Model IA ni otras vistas.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "fix: restore per-card body proportion values action"
git push
