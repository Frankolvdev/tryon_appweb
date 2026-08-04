# FIX AppWeb — Stack de ejecuciones por módulo dinámico

## Alcance

Este fix modifica únicamente la AppWeb. No cambia el backend ni la generación dinámica de módulos y formularios.

## Comportamiento nuevo

- Cada módulo carga sus últimas 20 ejecuciones, en vez de solo la más reciente.
- Crear una ejecución nueva la agrega al stack sin reemplazar las anteriores.
- Cada ejecución activa mantiene polling independiente por su `execution.id`.
- Cada ejecución puede cancelarse de forma individual.
- Resultados, inputs, logs, progreso, tiempos y tokens permanecen dentro de su propia tarjeta.
- Al recargar la página se reconstruye el stack mediante el endpoint existente `execution-history`.
- El formulario dinámico, sus validaciones y la selección automática de proveedor permanecen intactos.

## Archivos

- `src/components/generation/generation-studio.tsx`
- `src/components/generation/generation-studio.css`

## Validación

Se validó la sintaxis TSX con TypeScript `transpileModule`: 0 diagnósticos.

El build completo no pudo ejecutarse en el entorno de generación porque el registro npm interno no contiene `zod-validation-error@4.0.2`. Ejecutar localmente:

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm install
npm run build
npm run dev
```

## Git

```powershell
git add .
git commit -m "feat: support multiple generation executions per module"
git push
```
