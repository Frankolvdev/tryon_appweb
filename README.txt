FIX AppWeb — residual BackOffice Body Proportions

Causa comprobada:
- tryon_appweb-main (81).zip NO contiene:
  src/app/dashboard/tools-generation/body-proportions/page.tsx
- El hotfix Models Bubble Butt tampoco contiene ese archivo.
- Ese módulo quedó residual en el árbol local del AppWeb.

El fix correcto NO es copiar body-proportion-tools.ts al AppWeb.
Eso mezclaría código BackOffice dentro del frontend de usuario.

Este script elimina SOLAMENTE:
src/app/dashboard/tools-generation/body-proportions/

Y elimina tools-generation/ solo si queda totalmente vacío.

No modifica:
- Models
- Create Model IA
- dashboard/tryon/generation-modules
- src/types
- estilos
- backend
- otras rutas

Uso:
1. Copia LIMPIAR_RESIDUO_BODY_PROPORTIONS_APPWEB.ps1 a la raíz de tryon_appweb.
2. Abre PowerShell en esa raíz.
3. Ejecuta:
   Set-ExecutionPolicy -Scope Process Bypass
   .\LIMPIAR_RESIDUO_BODY_PROPORTIONS_APPWEB.ps1
4. Después:
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   npm run build
