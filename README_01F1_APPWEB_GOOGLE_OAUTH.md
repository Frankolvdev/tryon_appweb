# 01F1 — AppWeb Google OAuth real

Este incremento conecta las pantallas existentes de login y registro con el flujo OAuth implementado en el backend.

## Incluye

- detección dinámica del proveedor Google;
- inicio OAuth mediante POST, sin URL hardcodeada;
- proxies internos de Next.js para providers, start y exchange;
- callback basado en código temporal de un solo uso;
- almacenamiento de access token y refresh token mediante el sistema existente;
- redirección final a `/dashboard`;
- manejo visible de errores;
- aceptación explícita de términos y mayoría de edad al crear una cuenta con Google.

## No modifica

- login por correo y contraseña;
- registro tradicional;
- verificación de correo;
- recuperación de contraseña;
- MFA;
- diseño general de autenticación.
