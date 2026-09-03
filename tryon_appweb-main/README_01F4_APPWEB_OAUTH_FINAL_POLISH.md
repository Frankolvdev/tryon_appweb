# 01F4 · Cierre de sesión y persistencia OAuth

Este incremento cierra el bloque OAuth del AppWeb sin agregar endpoints inexistentes al backend.

## Incluye

- Detección local de expiración del access token JWT.
- Invalidación inmediata de sesiones vencidas antes de llamar a la API.
- Limpieza centralizada ante respuestas HTTP 401.
- Sincronización de login/logout entre pestañas del navegador.
- Revalidación de la cuenta al recuperar foco o volver a la pestaña.
- Redirección segura al login conservando la ruta privada solicitada.
- Logout completo con cierre del menú, limpieza de credenciales y refresco del router.

## Nota sobre refresh tokens

El AppWeb conserva el refresh token cuando el backend lo entrega, pero este incremento no inventa una ruta de renovación. La renovación automática debe activarse únicamente cuando el backend exponga y documente su endpoint real de refresh.
