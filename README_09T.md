# 09T · AppWeb UI/UX Polish

ZIP incremental basado en la versión pública actual de `Frankolvdev/tryon_appweb`.

## Alcance

- Conserva el fondo, arquitectura, endpoints y comportamiento existente.
- Unifica tipografía, espaciado, radios, sombras y estados de foco.
- Reemplaza visualmente los símbolos inconsistentes del menú por iconos CSS coherentes.
- Mejora sidebar, encabezados, tarjetas, tablas, botones, formularios y estados de carga.
- Agrega microanimaciones discretas y respeta `prefers-reduced-motion`.
- Mejora Billing: tarjetas balanceadas, movimientos de ancho completo, facturas de ancho completo y acciones más claras.
- Refina responsive para escritorio, tablet y móvil.

## Aplicación

Descomprimir directamente en la raíz de `tryon_appweb`. No contiene carpeta raíz adicional.

## Validación

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
