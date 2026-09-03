# Hotfix Create Model IA — scanner motion real

Base exacta: AppWeb 78.

Causa encontrada:
`translateY(100%)` se estaba calculando respecto a la propia línea del scanner
(3 px de alto), no respecto a la altura de la imagen. Por eso parecía quedarse
arriba durante la carga.

Cambio único:
- El scanner ahora anima la propiedad `top` desde `0` hasta `calc(100% - 3px)`,
  recorriendo realmente toda la imagen de arriba a abajo y viceversa.

Se conserva SIN CAMBIOS:
- mínimo forzoso = 1.3 s;
- `Promise.all([imageReadyPromise, minimumVisiblePromise])`;
- duración total = max(1.3 s, tiempo real de carga);
- blur desde que comienza la carga;
- scanner activo durante toda la carga;
- Breast por `breast_band` real;
- sliders;
- FaceSwap / Generation;
- auth, billing, gallery, backend y demás módulos.

Ejemplos:
- imagen carga en 0.4 s -> scanner/blur duran 1.3 s;
- imagen carga en 1.0 s -> duran 1.3 s;
- imagen carga en 1.6 s -> duran 1.6 s;
- imagen carga en 4.0 s -> duran 4.0 s.

Aplicación:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev

Git:
git add .
git commit -m "fix: make Create Model loading scanner traverse full preview"
git push
