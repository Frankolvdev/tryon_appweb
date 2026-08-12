HOTFIX Models — true scanner-edge alignment

ÚNICOS cambios:
- Elimina el 4% de margen izquierdo extra que todavía desplazaba nombre + widget.
- Nombre y widget quedan sobre el mismo filo izquierdo del scanner.
- Nombre de la modelo ligeramente más pequeño.
- Añade 20px de separación debajo del nombre antes del widget.

NO cambia:
- scanner ni crop
- Butt Elevation
- botón Ver todas las variantes
- sliders
- selección/persistencia
- backend/API
- otros módulos

Solo modifica:
src/app/globals.css
