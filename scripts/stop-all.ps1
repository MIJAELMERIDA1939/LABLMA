<#
.SYNOPSIS
  Detiene todos los servicios SGC.
#>

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$logDir = "$root\logs"
$t = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "[$t] Deteniendo SGC..."

# Matar procesos hijos del monitor
Get-Process -Name "powershell" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "monitor-run" } | Stop-Process -Force

# Matar backend
Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "uvicorn" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Matar frontend
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Matar tunnel
Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force

# Limpiar archivo temporal del monitor
Remove-Item "$logDir\monitor-run.ps1" -ErrorAction SilentlyContinue

Write-Host "[$t] SGC detenido."
