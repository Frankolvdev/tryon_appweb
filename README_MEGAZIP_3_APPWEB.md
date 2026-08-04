# MegaZIP 3 — AppWeb: estimación y cobro final

## Alcance

Este paquete es incremental y contiene únicamente los archivos nuevos o modificados necesarios para integrar la AppWeb con el pricing dinámico del backend.

### Antes de ejecutar

La pantalla muestra, usando exclusivamente la respuesta del backend:

- duración estimada;
- origen de la estimación (inicial o promedio histórico);
- tokens estimados;
- proveedor y GPU configurados.

### Al finalizar, fallar o cancelar

La pantalla muestra:

- tiempo real medido por el backend;
- tokens finales;
- devolución o débito adicional cuando hubo reconciliación.

## Blindaje

No cambia:

- creación de ejecuciones;
- polling cada dos segundos;
- recuperación del mismo `execution_id`;
- cancelaciones;
- estados existentes;
- selección del proveedor por el backend;
- renderizado de resultados.

La AppWeb no replica fórmulas de pricing: el backend continúa siendo la única fuente de verdad.

## Aplicación

Descomprimir sobre la raíz de `tryon_appweb`.

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm install
npm run build
npm run dev
```

## Git

```powershell
git add .
git commit -m "feat: show estimated and final generation pricing"
git push
```

## Validación realizada

Los archivos TypeScript modificados pasaron validación sintáctica con TypeScript 5.8.3.

No fue posible completar `npm install` en el entorno de generación porque el registro npm interno no contenía `zod-validation-error@4.0.2`, una dependencia transitiva. La compilación completa debe ejecutarse localmente.
