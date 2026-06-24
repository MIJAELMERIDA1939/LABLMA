param(
    [switch]$Restore,
    [switch]$Disable,
    [switch]$Enable
)

$projectRoot = "C:\LABUGRAM\sgc"
$avp = "C:\Program Files (x86)\Kaspersky Lab\Kaspersky 21.25\avp.com"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Este script requiere permisos de administrador." -ForegroundColor Red
    Write-Host "Ejecuta PowerShell como Administrador y corre:" -ForegroundColor Yellow
    Write-Host "  .\scripts\fix-kaspersky.ps1" -ForegroundColor Cyan
    exit 1
}

function Write-Step($m, $c) { Write-Host "  $m" -ForegroundColor $c }

if ($Restore) {
    Write-Host "Restaurando proteccion de Kaspersky..." -ForegroundColor Yellow
    if (Test-Path $avp) {
        & $avp START File_Monitoring 2>$null
        & $avp START HipsTask 2>$null
        Write-Step "File_Monitoring y HIPS reanudados" Green
    }
    exit
}

if ($Disable) {
    Write-Host "DESACTIVANDO proteccion de Kaspersky..." -ForegroundColor Red
    Write-Host "  (Solo temporal. Para reactivar: .\scripts\fix-kaspersky.ps1 -Restore)" -ForegroundColor Yellow
    if (Test-Path $avp) {
        & $avp STOP File_Monitoring 2>$null
        & $avp STOP HipsTask 2>$null
        Write-Step "File_Monitoring detenido" Green
        Write-Step "HIPS detenido" Green
        Write-Step "Proteccion desactivada temporalmente" Green
        Write-Step "Para reactivar: .\scripts\fix-kaspersky.ps1 -Restore" Yellow
    } else { Write-Step "avp.com no encontrado" Red }
    exit
}

if ($Enable) {
    Write-Host "Reactivando proteccion de Kaspersky..." -ForegroundColor Yellow
    if (Test-Path $avp) {
        & $avp START File_Monitoring 2>$null
        & $avp START HipsTask 2>$null
        Write-Step "File_Monitoring y HIPS reanudados" Green
    }
    exit
}

Write-Host ""
Write-Host "SGC - Exclusiones de Antivirus" -ForegroundColor Cyan
Write-Host ""

$pathsToExclude = @(
    $projectRoot,
    "$env:USERPROFILE\cloudflared.exe",
    "$env:USERPROFILE\.cloudflared"
)

Write-Host "1. Agregando exclusiones a Windows Defender..." -ForegroundColor Yellow
foreach ($p in $pathsToExclude) {
    try {
        Add-MpPreference -ExclusionPath $p -ErrorAction SilentlyContinue
        Write-Step "[OK] Defender: $p" Green
    } catch {
        Write-Step "[!] Defender: $p -> $_" DarkGray
    }
}

Write-Host "2. Refrescando Kaspersky..." -ForegroundColor Yellow
if (Test-Path $avp) {
    try {
        & $avp STOP File_Monitoring 2>$null
        Start-Sleep -Seconds 2
        & $avp START File_Monitoring 2>$null
        Write-Step "[OK] Kaspersky File_Monitoring refrescado" Green
    } catch { Write-Step "[!] Error: $_" Red }
}

Write-Host ""
Write-Host "INSTRUCCIONES MANUALES (si aun detecta):" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Abri Kaspersky (click derecho en icono K -> 'Abrir Kaspersky')"
Write-Host "2. Click en el engranaje (Configuracion) abajo a la izquierda"
Write-Host "3. Pestana 'Proteccion' -> 'Amenazas y exclusiones'"
Write-Host "4. Click en 'Gestionar exclusiones' -> 'Agregar'"
Write-Host "5. Agrega la carpeta (incluir subcarpetas):"
Write-Host "   C:\LABUGRAM\sgc" -ForegroundColor Green
Write-Host "6. Agrega tambien:"
Write-Host "   $env:USERPROFILE\cloudflared.exe" -ForegroundColor Green
Write-Host "7. Guarda y cierra"
Write-Host ""
Write-Host "ALTERNATIVA TEMPORAL:" -ForegroundColor Yellow
Write-Host "  Desactivar: .\scripts\fix-kaspersky.ps1 -Disable" -ForegroundColor Cyan
Write-Host "  Reactivar:  .\scripts\fix-kaspersky.ps1 -Restore" -ForegroundColor Cyan
Write-Host ""
Write-Host "Los servicios SGC siguen corriendo en 2do plano." -ForegroundColor Green
