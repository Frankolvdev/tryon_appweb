# HOTFIX AppWeb44 — Create Model IA Proportions / Preload / Feed R6

Cambios incrementales sobre AppWeb44:

- Complexion Slim/Thick: preview lateral permanente si existe asset; ya no ocupa el fondo completo del botón.
- Tick de selección separado del preview.
- Bubble Butt conserva contrato 0..0.7 y ahora 0.7 es alcanzable aunque las marcas regulares sean cada 0.2.
- Todos los sliders muestran ticks/marcas magnéticas por sus puntos de snap (cada 0.2, más endpoint excepcional cuando el max no cae en múltiplo exacto).
- Preload real de posters/videos de assets de proporciones antes de montar los controles; skeleton durante la preparación.
- Feed de modelos: elimina body_image_url como fallback de portada. Solo muestra generated_image_url cuando existe selected_generation_file_id.
- No se añade aún un preview por defecto para modelos incompletos; queda para la fase posterior solicitada.

Archivos:
- src/components/models/body-proportions-step.tsx
- src/components/models/model-manager.tsx
- src/app/globals.css

Validación local del entorno de ChatGPT:
- npm run build no pudo ejecutarse porque el ZIP no contiene node_modules (`next: not found`).
- Ejecutar build protegido en el proyecto local antes de commit/push.
