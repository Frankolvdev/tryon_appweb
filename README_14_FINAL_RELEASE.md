# 14 · Cierre y validación final de AppWeb

Este incremento no sustituye módulos anteriores. Añade una comprobación reproducible de cierre para validar la estructura, lint y compilación de producción de AppWeb.

## Ejecutar

```powershell
npm install
npm run release:check
```

El comando valida archivos esenciales, ejecuta ESLint y después `next build`.

## Variables mínimas

Configura en `.env.local` la URL pública del backend usada por el proyecto. No subas secretos ni archivos `.env` al repositorio.
