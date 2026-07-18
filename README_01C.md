# 01C · Estudio Try-On e historial

Módulo incremental para aplicar sobre 01A y 01B.

Endpoints usados exclusivamente:
- POST /api/v1/tryon/
- GET /api/v1/tryon/?skip=0&limit=50

El formulario envía `person_image`, `item_image`, `item_type`, `quality_mode` y `prompt` mediante multipart/form-data.
