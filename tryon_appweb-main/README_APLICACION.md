FIX UX ACEPTACIÓN LEGAL

- Un checkbox principal: Acepto todas las condiciones obligatorias.
- Detalles colapsados por defecto.
- Ver detalles despliega cada política y conserva enlaces a documentos completos.
- Las aceptaciones individuales siguen existiendo y pueden desmarcarse dentro del detalle.
- Inicio inmediato y primer consumo siguen formando parte del bundle legal.
- OAuth usa el mismo patrón compacto para términos, privacidad y edad.
- No se permite continuar sin aceptación afirmativa.

No requiere .env.

Git:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
git add .
git commit -m "ux: simplify legal consent without weakening acceptance"
git push
