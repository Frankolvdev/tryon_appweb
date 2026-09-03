LIMPIEZA QUIRURGICA APPWEB

Este script NO reemplaza tu AppWeb completo.

Se basa en la auditoria de tu ZIP actual tryon_appweb-main (82).zip.

Archivo confirmado como contaminacion BackOffice:
src/app/dashboard/tools-generation/body-proportions/page.tsx

Antes de eliminarlo verifica DOS firmas:
1. @/types/body-proportion-tools
2. /api/admin/tools-generation/body-proportions

Si alguna firma no coincide, el archivo NO se elimina.

Despues:
- elimina body-proportions/ solo si queda vacio;
- elimina tools-generation/ solo si queda vacio;
- busca referencias residuales conocidas y las REPORTA, no las borra;
- verifica que src/app/dashboard/tryon permanezca intacto.

USO

Desde:
F:\PROYECTOS PERSONALES\TRYON\appweb

Ejecutar:

Set-ExecutionPolicy -Scope Process Bypass
.\LIMPIAR_SOLO_CONTAMINACION_BACKOFFICE_APPWEB.ps1

Luego:

Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build

Si compila:

npm run dev

Git:

git add .
git commit -m "fix: remove accidental BackOffice contamination from AppWeb"
git push
