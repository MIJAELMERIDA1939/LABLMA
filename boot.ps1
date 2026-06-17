<#
.SYNOPSIS
  SGC — Master Bootstrap. Un solo comando para levantar todo el sistema en Windows 11.
.DESCRIPTION
  Detecta e instala Python, Node.js, dependencias, corre migraciones, seed y arranca
  backend + frontend. Idempotente: si ya está instalado, lo salta.
.EXAMPLE
  .\boot.ps1              # Modo normal (pide admin si hace falta)
  .\boot.ps1 -NoInstall   # Solo arranca, no instala nada
#>

param(
    [switch]$NoInstall
)

$root = Split-Path -Parent $PSCommandPath
$ErrorActionPreference = "Continue"
$global:LASTEXITCODE = 0

# ─── Colores ───
function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

# ─── Versiones mínimas ───
$reqPython = "3.12"
$reqNode   = "20"

# ─── Detectar si tenemos admin ───
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# ─── Verificar winget (Windows 11 viene con él) ───
function Test-Winget {
    return (Get-Command winget -ErrorAction SilentlyContinue) -ne $null
}

# ─── Versión numérica de un string semver ───
function Get-VersionNum($ver) {
    if (-not $ver) { return 0 }
    $parts = $ver -split '\.'
    return [int]$parts[0] * 10000 + [int]$parts[1] * 100 + [int](if ($parts[2]) { $parts[2] } else { 0 })
}

# ═══════════════════════════════════════════
# 1. VERIFICAR / INSTALAR Python
# ═══════════════════════════════════════════
if (-not $NoInstall) {
    Write-Step "Verificando Python..."

    $pythonExe = (Get-Command python -ErrorAction SilentlyContinue) -or (Get-Command python3 -ErrorAction SilentlyContinue)
    $pythonOk = $false
    $pyCmd = $null

    foreach ($cmd in @("python", "python3")) {
        $exe = Get-Command $cmd -ErrorAction SilentlyContinue
        if ($exe) {
            try {
                $ver = & $cmd --version 2>&1
                if ($ver -match "Python (\d+\.\d+)") {
                    $v = [version]$Matches[1]
                    $min = [version]$reqPython
                    if ($v -ge $min) {
                        $pythonOk = $true
                        $pyCmd = $cmd
                        Write-Ok "Python $v detectado en $($exe.Source)"
                        break
                    } else {
                        Write-Warn "Python $v detectado, pero se necesita >= $reqPython"
                    }
                }
            } catch { }
        }
    }

    if (-not $pythonOk) {
        if (-not $isAdmin) {
            Write-Warn "Se necesita instalar Python. Solicitando permisos de administrador..."
            try {
                Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait
                exit
            } catch {
                Write-Fail "No se pudo elevar a admin. Instala Python $reqPython+ manualmente desde https://python.org"
                Write-Host "  Luego ejecuta .\boot.ps1 -NoInstall para solo arrancar" -ForegroundColor Yellow
                exit 1
            }
        }

        if (Test-Winget) {
            Write-Host "  Instalando Python $reqPython via winget..."
            winget install --id Python.Python.$($reqPython -replace '\.') -e --silent --accept-package-agreements 2>&1 | Out-Null
            refreshenv 2>$null
            $pyCmd = "python"
            Write-Ok "Python instalado. (Reabre la terminal si no se reconoce)"
        } else {
            Write-Fail "winget no disponible. Instala Python $reqPython manualmente desde python.org"
            exit 1
        }
    }
} else {
    $pyCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "python3" }
}

# ═══════════════════════════════════════════
# 2. VERIFICAR / INSTALAR Node.js
# ═══════════════════════════════════════════
if (-not $NoInstall) {
    Write-Step "Verificando Node.js..."

    $nodeOk = $false
    $nodeCmd = "node"

    try {
        $ver = & node --version 2>&1
        if ($ver -match "v(\d+)") {
            $v = [int]$Matches[1]
            if ($v -ge [int]$reqNode) {
                $nodeOk = $true
                Write-Ok "Node.js $ver detectado"
            } else {
                Write-Warn "Node.js $ver detectado, se necesita v$reqNode+"
            }
        }
    } catch { }

    if (-not $nodeOk) {
        if (-not $isAdmin) {
            Write-Warn "Se necesita instalar Node.js. Solicitando permisos de administrador..."
            try {
                Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait
                exit
            } catch {
                Write-Fail "No se pudo elevar a admin. Instala Node.js LTS manualmente desde https://nodejs.org"
                exit 1
            }
        }

        if (Test-Winget) {
            Write-Host "  Instalando Node.js $reqNode LTS via winget..."
            winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements 2>&1 | Out-Null
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            Write-Ok "Node.js instalado. (Reabre la terminal si no se reconoce)"
        } else {
            Write-Fail "winget no disponible. Instala Node.js manualmente desde nodejs.org"
            exit 1
        }
    }
}

# ═══════════════════════════════════════════
# 3. BACKEND — venv + pip
# ═══════════════════════════════════════════
Write-Step "Configurando backend Python..."
$beDir = "$root\backend"

if (-not (Test-Path "$beDir\venv")) {
    Write-Host "  Creando entorno virtual..."
    & $pyCmd -m venv "$beDir\venv"
    if ($LASTEXITCODE -ne 0) { Write-Fail "Error creando venv"; exit 1 }
    Write-Ok "venv creado"
} else {
    Write-Ok "venv ya existe"
}

Write-Host "  Instalando dependencias Python..."
& "$beDir\venv\Scripts\pip" install --upgrade pip -q 2>$null
& "$beDir\venv\Scripts\pip" install -r "$beDir\requirements.txt" -q
if ($LASTEXITCODE -ne 0) { Write-Fail "Error instalando requirements"; exit 1 }
Write-Ok "Dependencias Python instaladas"

# ═══════════════════════════════════════════
# 4. FRONTEND — npm install
# ═══════════════════════════════════════════
Write-Step "Configurando frontend Node.js..."
$feDir = "$root\frontend"

if (Test-Path "$feDir\node_modules") {
    Write-Ok "node_modules ya existe"
} else {
    Write-Host "  Instalando dependencias Node.js..."
    Set-Location $feDir
    npm install --silent 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Fail "Error en npm install"; exit 1 }
    Write-Ok "Dependencias Node.js instaladas"
}

# ═══════════════════════════════════════════
# 5. .env FILES (crear por defecto si no existen)
# ═══════════════════════════════════════════
Write-Step "Verificando configuracion..."

$beEnv = "$root\backend\.env"
if (-not (Test-Path $beEnv)) {
    @"
DATABASE_URL=sqlite+aiosqlite:///../data/sgc.db
SECRET_KEY=sgc-dev-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=SGC Sistema <noreply@sgc.local>
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NC=alerta_nc
WHATSAPP_TEMPLATE_DOC=alerta_documento
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
CRON_SECRET=change-cron-secret
"@ | Set-Content -Path $beEnv -Encoding UTF8
    Write-Ok ".env creado en backend/"
}

$feEnv = "$root\frontend\.env.local"
if (-not (Test-Path $feEnv)) {
    @"
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME=SGC - Sistema de Gestión de Calidad
"@ | Set-Content -Path $feEnv -Encoding UTF8
    Write-Ok ".env.local creado en frontend/"
}

# ═══════════════════════════════════════════
# 6. DIRECTORIO DE DOCUMENTOS
# ═══════════════════════════════════════════
$docsDir = "$root\backend\documentos_edicion"
if (-not (Test-Path $docsDir)) {
    New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
    Write-Ok "Directorio de documentos creado"
} else {
    Write-Ok "Directorio de documentos OK"
}

# ═══════════════════════════════════════════
# 6. MIGRACIONES + SEED
# ═══════════════════════════════════════════
Write-Step "Corriendo migraciones y seed..."
$venvPython = "$beDir\venv\Scripts\python.exe"
Set-Location $beDir

Write-Host "  Migrando base de datos..."
& $venvPython -m alembic upgrade head 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Error en migraciones. Intentando crear tablas directamente..."
    & $venvPython -c "from app.database import engine, Base; import app.models.usuario, app.models.documento, app.models.version_documento, app.models.historial_documento, app.models.no_conformidad, app.models.plan_accion, app.models.riesgo, app.models.plan_programa, app.models.tarea_plan, app.models.notificacion; import asyncio; asyncio.run(Base.metadata.create_all(engine))" 2>&1
}
Write-Ok "Base de datos lista"

Write-Host "  Sembrando datos demo..."
& $venvPython -m app.seed 2>&1
Write-Ok "Seed completado"

# ═══════════════════════════════════════════
# 7. INICIAR TODO
# ═══════════════════════════════════════════
# ─── Detectar IPs de red local ───
function Get-LanIPs {
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -like '192.168.*' -or
        $_.IPAddress -like '10.*' -or
        ($_.IPAddress -like '172.*' -and [int]($_.IPAddress -split '\.')[1] -ge 16 -and [int]($_.IPAddress -split '\.')[1] -le 31)
    } | Select-Object -ExpandProperty IPAddress
    if (-not $ips) { $ips = @() }
    return $ips
}

$lanIPs = Get-LanIPs
$frontendPort = 3000
$backendPort = 8000

Write-Step "Iniciando SGC..."
Write-Host ""
Write-Host "  RED LOCAL (accede desde cualquier dispositivo en tu red):" -ForegroundColor Cyan
Write-Host "  Frontend → http://localhost:${frontendPort}" -ForegroundColor Green
Write-Host "  Backend  → http://localhost:${backendPort}" -ForegroundColor Green
Write-Host "  API Docs → http://localhost:${backendPort}/docs" -ForegroundColor Green
foreach ($ip in $lanIPs) {
    Write-Host "  LAN      → http://${ip}:${frontendPort}" -ForegroundColor Green
}
Write-Host ""
Write-Host "  INTERNET (accede desde cualquier parte del mundo):" -ForegroundColor Cyan
Write-Host "  Opcion 1: npm run infra:tunnel:start   (Cloudflare Tunnel)" -ForegroundColor Yellow
Write-Host "  Opcion 2: Configurar puerto 3000/8000 en tu router" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Credenciales demo:" -ForegroundColor Yellow
Write-Host "    admin@sgc.local / Admin1234!" -ForegroundColor Gray
Write-Host ""

# Matar procesos previos
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next" } | Stop-Process -Force

# Iniciar backend (0.0.0.0 = accesible desde la red local)
$backendJob = Start-Job -Name "sgc-backend" -ScriptBlock {
    Set-Location "$using:beDir"
    & "$using:beDir\venv\Scripts\python" -m uvicorn app.main:app --host 0.0.0.0 --port $using:backendPort --reload
}

Start-Sleep -Seconds 3

# Iniciar frontend (0.0.0.0 = accesible desde la red local)
$frontendJob = Start-Job -Name "sgc-frontend" -ScriptBlock {
    Set-Location "$using:feDir"
    & "$using:feDir\node_modules\.bin\next" dev --host 0.0.0.0 --port $using:frontendPort
}

# Esperar señal de salida
try {
    Write-Host "Presiona Ctrl+C para detener ambos servicios" -ForegroundColor Red
    while ($true) {
        Start-Sleep -Seconds 2

        $bOut = Receive-Job $backendJob -ErrorAction SilentlyContinue
        $fOut = Receive-Job $frontendJob -ErrorAction SilentlyContinue
        if ($bOut) { $bOut | ForEach-Object { Write-Host "  [BE] $_" -ForegroundColor DarkCyan } }
        if ($fOut) { $fOut | ForEach-Object { Write-Host "  [FE] $_" -ForegroundColor DarkMagenta } }

        if ($backendJob.State -eq "Failed") {
            Write-Fail "Backend falló. Últimos logs:"
            Receive-Job $backendJob -ErrorAction SilentlyContinue
            break
        }
        if ($frontendJob.State -eq "Failed") {
            Write-Fail "Frontend falló. Últimos logs:"
            Receive-Job $frontendJob -ErrorAction SilentlyContinue
            break
        }
    }
} finally {
    Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "SGC detenido." -ForegroundColor Green
}
