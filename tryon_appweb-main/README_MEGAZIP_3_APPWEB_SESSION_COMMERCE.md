# MegaZIP 3 — AppWeb Session Recovery and Protected Commerce

## Alcance

- Renueva el access token mediante `/api/v1/auth/refresh` antes de cerrar la sesión.
- Comparte una sola solicitud de refresh entre llamadas concurrentes.
- No elimina la sesión por una caída temporal del backend.
- Evita que `Abriendo tu estudio…` quede visible indefinidamente; muestra reintento controlado.
- Mantiene compatibilidad con Google OAuth y correo/contraseña.
- Muestra precio nominal, descuento efectivo, ahorro y precio final de planes y paquetes usando exclusivamente datos del backend.
- Elimina promociones genéricas de Stripe desde AppWeb.
- Envía `coupon_code` al backend únicamente para paquetes y compra libre de tokens.
- Mantiene planes sin campo ni aplicación de cupón.

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
git commit -m "feat: add resilient session refresh and protected commerce"
git push
```

## Validación

El entorno de generación no pudo completar `npm install` porque su registro interno no contiene `zod-validation-error@4.0.2`. Ejecutar el build definitivo localmente.
