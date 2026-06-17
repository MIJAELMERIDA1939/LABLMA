# Script de instalación silenciosa de LibreOffice
# Ejecutar como ADMINISTRADOR (clic derecho > "Ejecutar como administrador")
#
# Usage:
#   .\install-libreoffice.ps1

$ErrorActionPreference = "Stop"
$Version = "26.2.4"
$Url = "https://download.documentfoundation.org/libreoffice/stable/$Version/win/x86_64/LibreOffice_${Version}_Win_x86-64.msi"
$Installer = "$env:TEMP\LibreOffice_install.msi"
$LogFile = "$env:TEMP\libreoffice_install.log"

Write-Host "=== Instalador de LibreOffice $Version ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si ya está instalado
$existing = Get-ItemProperty "HKLM:\SOFTWARE\LibreOffice\LibreOffice" -Name Path -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "LibreOffice ya está instalado en: $($existing.Path)" -ForegroundColor Green
    exit 0
}

Write-Host "Descargando LibreOffice $Version..." -ForegroundColor Yellow
Write-Host "Origen: $Url"

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $Url -OutFile $Installer -UseBasicParsing

Write-Host "Descarga completa. Instalando..." -ForegroundColor Yellow
Write-Host "Esto puede tomar varios minutos..." -ForegroundColor Yellow

$proc = Start-Process msiexec -ArgumentList "/i `"$Installer`" /quiet /norestart /log `"$LogFile`"" -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -eq 0) {
    Write-Host ""
    Write-Host "=== LibreOffice $Version instalado correctamente ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: La instalación falló con código $($proc.ExitCode)" -ForegroundColor Red
    Write-Host "Revisa el log: $LogFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "1. No ejecutaste como administrador" -ForegroundColor Yellow
    Write-Host "2. Falta el redistribuible de VC++" -ForegroundColor Yellow
    Write-Host "3. El sistema no es x86_64" -ForegroundColor Yellow
    exit 1
}

# Limpiar
Remove-Item $Installer -Force -ErrorAction SilentlyContinue
