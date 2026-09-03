# 09T2 AppWeb — estructura de facturación

Descomprime en la raíz de `tryon_appweb` y ejecuta:

```powershell
.\APLICAR_09T2_APPWEB.ps1
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

Reorganiza exclusivamente la presentación de Billing. No modifica endpoints ni lógica de Stripe.
