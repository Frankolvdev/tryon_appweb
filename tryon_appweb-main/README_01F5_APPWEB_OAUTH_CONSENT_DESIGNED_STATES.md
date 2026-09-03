# 01F5 · Consentimiento OAuth y estados diseñados

Este incremento reemplaza la confirmación nativa del navegador y la pantalla OAuth básica por una experiencia visual integrada con LUXIA.

## Incluye

- Modal obligatorio antes de iniciar Google OAuth.
- Aceptación separada de Términos de uso y Política de privacidad.
- Confirmación de mayoría de edad.
- La aceptación se aplica desde Login y Registro porque antes de consultar Google el AppWeb no sabe si el correo corresponde a un usuario existente o uno nuevo.
- Envío real de `terms_accepted`, `terms_version` y `age_confirmed` al backend.
- Pantallas diseñadas para carga, éxito, advertencia y error.
- Traducción de errores conocidos: términos no aceptados, cuenta administrativa, autorización cancelada, proveedor deshabilitado y solicitud expirada.
- Ruta reutilizable `/oauth/error` para que el backend pueda redirigir errores OAuth sin mostrar JSON.

## Importante

El AppWeb ya puede mostrar errores diseñados cuando el backend regresa al callback del AppWeb con parámetros de error.

Para eliminar también los JSON que el callback público del backend responde directamente, el siguiente ajuste debe realizarse en el backend: capturar sus excepciones OAuth y redirigir a `/oauth/error` o `/oauth/callback?error=...` en el AppWeb. Ese cambio pertenece al backend y no se inventó dentro de este ZIP.
