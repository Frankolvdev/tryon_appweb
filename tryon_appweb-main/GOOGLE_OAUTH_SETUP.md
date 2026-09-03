# Google OAuth — AppWeb

## Flujo implementado

1. AppWeb consulta `GET /api/v1/oauth/providers` mediante su proxy interno.
2. AppWeb solicita el inicio con `POST /api/v1/oauth/google/start`.
3. El backend entrega la URL segura de Google.
4. Google regresa al callback del backend.
5. El backend redirige a `http://localhost:3003/oauth/callback?code=...`.
6. AppWeb canjea el código de un solo uso en `POST /api/v1/oauth/exchange`.
7. AppWeb guarda los tokens y abre `/dashboard`.

Los access tokens y refresh tokens no viajan en la URL del navegador.

## AppWeb `.env.local`

```env
API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_LANDING_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

Ya no se utiliza `NEXT_PUBLIC_GOOGLE_OAUTH_START_URL`: el inicio es un `POST` real y pasa por el proxy de Next.js.

## Backend

```env
FRONTEND_URL=http://localhost:3003
```

Redis debe estar activo.

## Google Cloud

URI de redirección autorizada en desarrollo:

```text
http://127.0.0.1:8001/api/v1/oauth/google/callback
```

El proveedor Google debe estar habilitado y configurado en el BackOffice. El frontend mantiene el botón desactivado mientras el endpoint público indique que Google no está disponible.
