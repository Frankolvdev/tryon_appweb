# 01F2 AppWeb — OAuth callback, session and UX

Incremento sobre 01F1.

## Cambios

- Conserva de forma segura la ruta `next` durante el viaje a Google.
- Rechaza destinos externos o malformados para evitar redirecciones abiertas.
- Evita iniciar un segundo flujo OAuth cuando ya existe una sesión local.
- Impide doble ejecución del callback en React Strict Mode.
- Valida `/api/auth/me` después de canjear el código antes de abrir el área privada.
- Limpia tokens si la validación final falla.
- Aplica la misma redirección `next` al login tradicional.
- Mejora los estados de carga y accesibilidad del proceso.

## Prueba recomendada

1. Abre `/login?next=/try-on`.
2. Inicia sesión con Google.
3. Al terminar debes regresar a `/try-on`.
4. Repite con login tradicional y comprueba el mismo comportamiento.
