# MEGAFIX AppWeb — Occupation outfit prompts

Cambio quirúrgico sobre el último AppWeb recibido.

## Archivo funcional modificado
- `src/lib/occupation-catalog.ts`

## Qué cambia
- Las 140 ocupaciones del catálogo ahora tienen un prompt `clothes` concreto y determinista.
- `student` se trata explícitamente como **adult university student** y recibe un outfit fashion SFW específico.
- Ocupaciones médicas, técnicas, creativas, oficina, fitness, aviación, servicios, etc. reciben prendas, calzado y accesorios propios del rol.
- La opción `custom` usa el texto escrito por el usuario dentro de una instrucción genérica en inglés para pedir vestimenta auténticamente apropiada a esa ocupación.
- Se mantiene intacto el contrato existente `getOccupationGenerationContext()` y las claves `place` / `clothes`; no cambia `face-studio.tsx`, inputs, backend, rutas, generación, billing ni demás flujo.

## Blindaje
- 140 ocupaciones detectadas.
- 140 prompts específicos detectados.
- 0 ocupaciones sin prompt específico.
- Fallback genérico conservado para IDs inesperados.

## Verificación local recomendada
```bash
npm ci
npm run build
```

Nota: en el entorno de empaquetado la instalación de dependencias no concluyó dentro de la ventana de ejecución disponible, por lo que el build completo debe ejecutarse en el entorno del proyecto antes del deploy.
