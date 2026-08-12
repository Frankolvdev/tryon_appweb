HOTFIX position-only — Butt Elevation

Base reconstruida:
tryon_appweb-main (85).zip
+ HOTFIX_Models_ButtInside_TallerScanner_AppWeb.zip

ÚNICO cambio:
- Mueve Butt Elevation DENTRO de <section className="modelControls">.
- Lo coloca inmediatamente ANTES de <button className="modelConfirm"> ("Usar este cuerpo").

NO cambia:
- scanner
- alto/ancho/crop de imagen principal
- CSS del último fix
- sliders
- selección Butt Elevation
- persistencia
- backend
- otros módulos

Archivo único:
src/components/models/model-studio.tsx
