# 01E14 — Password recovery inside official AuthShell

Este ZIP corrige el doble layout observado en `/forgot-password`.

## Cambios

- Elimina el uso de `PasswordRecoveryLayout` en las rutas.
- Usa directamente el `AuthShell` oficial del login.
- Conserva recuperación, reenvío, contador, validaciones y medidor.
- Usa las clases `boAuthForm`, `boField`, `boInputWrap`, `boPrimaryButton` y `boSwitchAuth`.
- Agrega solo estilos complementarios para los estados de recuperación.

## Instalación

Descomprime sobre la raíz de AppWeb y ejecuta:

```powershell
python scripts/apply_01e14_recovery_styles.py
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
