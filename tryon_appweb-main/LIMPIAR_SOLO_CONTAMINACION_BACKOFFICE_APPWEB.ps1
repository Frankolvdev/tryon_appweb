$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== LIMPIEZA QUIRURGICA APPWEB ===" -ForegroundColor Cyan
Write-Host "Este script NO reemplaza el proyecto y NO borra carpetas completas a ciegas." -ForegroundColor Green
Write-Host ""

$root = Get-Location
$package = Join-Path $root "package.json"

if (!(Test-Path $package)) {
    throw "No encuentro package.json. Ejecuta este script desde la raiz de tryon_appweb."
}

$deleted = New-Object System.Collections.Generic.List[string]
$skipped = New-Object System.Collections.Generic.List[string]

function Remove-ConfirmedFile {
    param(
        [string]$RelativePath,
        [string[]]$RequiredSignatures
    )

    $fullPath = Join-Path $root $RelativePath

    if (!(Test-Path $fullPath -PathType Leaf)) {
        Write-Host "NO EXISTE: $RelativePath" -ForegroundColor DarkGray
        return
    }

    $content = Get-Content $fullPath -Raw -ErrorAction Stop

    foreach ($signature in $RequiredSignatures) {
        if (!$content.Contains($signature)) {
            Write-Host "PROTEGIDO: $RelativePath" -ForegroundColor Yellow
            Write-Host "  No contiene la firma esperada: $signature" -ForegroundColor DarkYellow
            $skipped.Add($RelativePath)
            return
        }
    }

    Remove-Item -Force $fullPath
    $deleted.Add($RelativePath)
    Write-Host "ELIMINADO CONFIRMADO: $RelativePath" -ForegroundColor Green
}

# ------------------------------------------------------------------
# CONTAMINACION CONFIRMADA EN TU APPWEB ACTUAL
# ------------------------------------------------------------------
# Este page.tsx pertenece a BackOffice. Se elimina SOLO si conserva
# ambas firmas que lo identifican inequivocamente como ese modulo.
Remove-ConfirmedFile `
    -RelativePath "src\app\dashboard\tools-generation\body-proportions\page.tsx" `
    -RequiredSignatures @(
        "@/types/body-proportion-tools",
        "/api/admin/tools-generation/body-proportions"
    )

# ------------------------------------------------------------------
# LIMPIEZA DE DIRECTORIOS VACIOS
# ------------------------------------------------------------------
# Solo elimina los padres si quedaron completamente vacios.
$bodyDir = Join-Path $root "src\app\dashboard\tools-generation\body-proportions"
if (Test-Path $bodyDir -PathType Container) {
    if (@(Get-ChildItem $bodyDir -Force).Count -eq 0) {
        Remove-Item -Force $bodyDir
        Write-Host "Directorio vacio eliminado: src\app\dashboard\tools-generation\body-proportions" -ForegroundColor DarkGreen
    }
}

$toolsDir = Join-Path $root "src\app\dashboard\tools-generation"
if (Test-Path $toolsDir -PathType Container) {
    if (@(Get-ChildItem $toolsDir -Force).Count -eq 0) {
        Remove-Item -Force $toolsDir
        Write-Host "Directorio vacio eliminado: src\app\dashboard\tools-generation" -ForegroundColor DarkGreen
    }
}

# ------------------------------------------------------------------
# AUDITORIA POSTERIOR
# ------------------------------------------------------------------
Write-Host ""
Write-Host "--- AUDITORIA DE REFERENCIAS CONTAMINADAS ---" -ForegroundColor Cyan

$remaining = Get-ChildItem (Join-Path $root "src") -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
    Where-Object {
        $text = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        $text -and (
            $text.Contains("@/types/body-proportion-tools") -or
            $text.Contains("/api/admin/tools-generation/body-proportions")
        )
    }

if ($remaining) {
    Write-Host "ATENCION: quedaron archivos sospechosos. NO fueron eliminados automaticamente:" -ForegroundColor Yellow
    foreach ($item in $remaining) {
        Write-Host "  $($item.FullName)" -ForegroundColor Yellow
    }
    Write-Host "Pasamelos antes de borrar nada mas." -ForegroundColor Yellow
} else {
    Write-Host "OK: no quedan referencias conocidas del BackOffice Body Proportions." -ForegroundColor Green
}

# Blindaje: confirmar que la ruta valida del AppWeb sigue presente.
$validTryon = Join-Path $root "src\app\dashboard\tryon"
if (Test-Path $validTryon -PathType Container) {
    Write-Host "OK: src\app\dashboard\tryon sigue intacto." -ForegroundColor Green
} else {
    Write-Host "AVISO: no encontre src\app\dashboard\tryon. El script NO lo ha tocado." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== RESULTADO ===" -ForegroundColor Cyan
Write-Host "Archivos eliminados: $($deleted.Count)"
foreach ($item in $deleted) {
    Write-Host "  - $item" -ForegroundColor Green
}

if ($skipped.Count -gt 0) {
    Write-Host "Archivos protegidos/no tocados: $($skipped.Count)" -ForegroundColor Yellow
    foreach ($item in $skipped) {
        Write-Host "  - $item" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Ahora ejecuta:" -ForegroundColor White
Write-Host 'Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue' -ForegroundColor Gray
Write-Host 'npm run build' -ForegroundColor Gray
Write-Host ""
