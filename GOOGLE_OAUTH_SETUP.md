# Configuración de Google OAuth

## 1. Google Cloud

1. Entra a Google Cloud Console y crea o selecciona el proyecto de TryOn.
2. Configura **Google Auth Platform / OAuth consent screen**.
3. Añade nombre, correo de soporte y dominios autorizados.
4. En **Clients**, crea un cliente **Web application**.

## 2. Orígenes autorizados

Desarrollo:

- `http://localhost:3001`
- `http://127.0.0.1:8001` si el backend inicia el flujo directamente.

Producción sugerida:

- `https://app.tudominio.com`
- `https://api.tudominio.com`

## 3. URI de redirección

La URI exacta debe ser la ruta callback implementada por el backend. No uses la ruta del frontend como callback de Google salvo que el backend esté diseñado expresamente así.

Flujo recomendado:

1. AppWeb redirige al endpoint OAuth del backend.
2. Backend redirige a Google.
3. Google vuelve al callback del backend.
4. Backend valida el código, crea/vincula al usuario y redirige a:
   `http://localhost:3001/oauth/callback?access_token=...`
5. AppWeb guarda la sesión y abre `/dashboard`.

## 4. Variables

En el backend configura los nombres que ya utilice su clase Settings, normalmente equivalentes a:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://127.0.0.1:8001/<callback-real-del-backend>
FRONTEND_APP_URL=http://localhost:3001
```

En `.env.local` de AppWeb:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_OAUTH_START_URL=http://127.0.0.1:8001/<inicio-real-google-oauth>
```

## 5. Seguridad

- Nunca subas `GOOGLE_CLIENT_SECRET` al frontend ni a Git.
- El frontend solo necesita la URL pública que inicia OAuth.
- En producción usa HTTPS.
- Autoriza exactamente los dominios reales.
- Configura CORS del backend para `http://localhost:3001` en desarrollo y para el dominio de AppWeb en producción.

## 6. Proveedores futuros

La pantalla ya reserva una capa visual para Apple, GitHub y Facebook. No se activan hasta que el backend implemente sus respectivos flujos OAuth reales.
