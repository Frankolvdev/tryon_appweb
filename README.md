# TryOn AppWeb

Aplicación web independiente para usuarios de AI Virtual Try-On.

## Inicio

```powershell
Copy-Item .env.example .env.local
npm install
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

La aplicación inicia en `http://localhost:3001`.

## Integración actual

- `POST /api/v1/auth/login`
- `POST /api/v1/users/`
- `GET /api/v1/users/me`
- Google OAuth mediante `NEXT_PUBLIC_GOOGLE_OAUTH_START_URL`, sin inventar una ruta fija.

Consulta `GOOGLE_OAUTH_SETUP.md`.
