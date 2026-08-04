# FIX AppWeb — Billing Session Render Loop

## Problema

Billing llama `refreshUser()` después de cargar información comercial. La implementación anterior de `refreshUser()` activaba el estado global `loading`, desmontaba la página Billing y mostraba `Abriendo tu estudio…`. Cuando la sesión terminaba de refrescar, Billing se montaba otra vez, volvía a ejecutar su carga y llamaba nuevamente `refreshUser()`, creando un ciclo infinito.

Ese ciclo provocaba también el error interno de React/Next en desarrollo:

`Cannot use 'in' operator to search for 'headCacheNode' in null`

## Corrección

- Se separa la restauración inicial bloqueante de la actualización silenciosa del usuario.
- `restoreSession()` mantiene la pantalla `Abriendo tu estudio…` solo durante el arranque real.
- `refreshUser()` actualiza saldo/datos de usuario sin desmontar las rutas protegidas.
- Los eventos de foco y visibilidad también usan actualización silenciosa.
- El botón Reintentar conserva la restauración bloqueante.

## Aplicación

Descomprimir sobre la raíz de AppWeb y limpiar caché:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Git

```powershell
git add .
git commit -m "fix: prevent billing session render loop"
git push
```
