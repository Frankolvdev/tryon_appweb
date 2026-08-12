HOTFIX Models 85

Cambios ÚNICOS:
- Butt Elevation vuelve dentro del card de sliders.
- Se coloca inmediatamente arriba del botón “Usar este cuerpo”.
- Se eliminan los textos Default / Level 1 / Level 2 / Level 3 para compactar.
- La selección visual se conserva y refuerza con zoom/borde/glow.
- El scanner se hace aproximadamente 10% más angosto y visualmente ~20% más alto.
- NO se deforma la imagen:
  - object-fit: cover
  - recorte lateral intencional
  - centrado horizontal
- En pantallas <=1000px se vuelve a contain para evitar recortes agresivos.

No se toca:
- lógica de sliders
- persistencia Butt Elevation
- scanner/loading
- galería
- APIs
- backend
- otros módulos

Base exacta: tryon_appweb-main (85).zip
