# FIX AppWeb — modal legal y páginas de políticas

- Elimina el bloque permanente de casillas en Billing.
- Muestra un modal breve solo cuando faltan aceptaciones o existe una versión nueva.
- Guarda la aceptación mediante el Backend.
- Obliga a aceptar las políticas reales antes del registro por correo.
- Los usuarios creados fuera del registro normal reciben el modal al entrar.
- Cada política se abre en una página nueva con el diseño de la AppWeb.

```powershell
cd "F:\PROYECTOS PERSONALES\TRYON\appweb"
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
