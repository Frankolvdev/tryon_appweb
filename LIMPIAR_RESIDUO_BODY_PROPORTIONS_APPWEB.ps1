$ErrorActionPreference = "Stop"

$target = Join-Path (Get-Location) "src\app\dashboard\tools-generation\body-proportions"

Write-Host ""
Write-Host "=== CLEANUP APPWEB: BODY PROPORTIONS RESIDUAL ===" -ForegroundColor Cyan
Write-Host "Proyecto actual: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

$package = Join-Path (Get-Location) "package.json"
if (!(Test-Path $package)) {
    throw "No encuentro package.json. Ejecuta este script desde la raiz de tryon_appweb."
}

if (Test-Path $target) {
    Write-Host "Encontrado modulo residual de BackOffice:" -ForegroundColor Yellow
    Write-Host $target -ForegroundColor Yellow
    Remove-Item -Recurse -Force $target
    Write-Host "Eliminado correctamente." -ForegroundColor Green
} else {
    Write-Host "La carpeta residual ya no existe. No se elimino nada." -ForegroundColor Green
}

# Remove empty parent tools-generation only if it became empty.
$parent = Split-Path $target -Parent
if (Test-Path $parent) {
    $children = @(Get-ChildItem $parent -Force)
    if ($children.Count -eq 0) {
        Remove-Item -Force $parent
        Write-Host "Tambien se elimino tools-generation porque quedo vacio." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "No se tocaron Models, dashboard\tryon, types, ni otros modulos." -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor White
Write-Host "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue" -ForegroundColor Gray
Write-Host "npm run build" -ForegroundColor Gray
Write-Host ""
