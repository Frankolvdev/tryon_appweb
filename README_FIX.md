HOTFIX Models 84 — scanner aspect ratio + Butt Elevation below preview

Base exacta:
tryon_appweb-main (84).zip

Cambios ÚNICOS:
1. El contenedor/escáner de la imagen principal deja de tener una altura artificial.
2. La altura ahora sale de la proporción intrínseca de la imagen:
   width: 100% + height: auto.
3. Se neutralizan las reglas anteriores de 560–720px que producían franjas negras.
4. Butt Elevation se mueve debajo de la imagen principal:
   - fuera del scanner;
   - fuera del card de sliders;
   - dentro de una columna visual izquierda independiente.
5. Se conserva toda la lógica React de selectedBubbleLevel.
6. Se restauran estilos visibles de selección:
   - zoom;
   - borde rojo;
   - glow;
   - Level seleccionado claramente marcado.
7. No se toca persistencia Backend, sliders, scanner/loading, galería,
   API, Models list, storage, generación ni otros módulos.

Archivos modificados:
- src/components/models/model-studio.tsx
- src/app/globals.css
