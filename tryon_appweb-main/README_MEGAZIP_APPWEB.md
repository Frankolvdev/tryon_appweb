# MegaZIP 3 — AppWeb checkout protegido

- Validar cupón guarda el cupón aprobado y muestra el precio final.
- Comprar envía únicamente el cupón validado.
- El backend recalcula el importe y Stripe recibe el precio final.
- Funciona para paquetes y compra libre de tokens.
- Los planes abren Checkout con el precio exacto calculado por backend.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
