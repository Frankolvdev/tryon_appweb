# 01E11 — Flujo real de verificación de correo

Integra exclusivamente los endpoints existentes:

- POST /api/v1/account-verification/request
- POST /api/v1/account-verification/resend
- POST /api/v1/account-verification/confirm

Incluye pantalla de espera, reenvío con contador, manejo del cooldown real,
confirmación del enlace y redirección desde el login cuando el backend indica
que el correo todavía no está verificado.
