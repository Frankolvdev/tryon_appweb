# FIX AppWeb — Library File Picker build

Corrección incremental y aislada.

## Archivo a reemplazar

`src/components/generation/library-file-picker.tsx`

## Corrección

Se agregó la llave faltante que cierra la expresión JSX del atributo `onClick` en el botón de selección de archivos de la librería.

No se modificó ningún otro archivo ni funcionalidad.

## Validación

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Git

```powershell
git add .
git commit -m "fix: correct library file picker JSX syntax"
git push
```
