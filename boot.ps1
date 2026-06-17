<#
.SYNOPSIS
  SGC — Master Bootstrap. Un solo comando para descomprimir y tener todo andando.
.DESCRIPTION
  - Detecta/instala Python + Node.js + dependencias
  - Configura base de datos + seed
  - Abre puertos en firewall para red local
  - Descarga/configura Cloudflare Tunnel (lablma.com)
  - Inicia backend + frontend + tunnel + auto-deploy
  - Instala tarea programada para inicio automatico con Windows
  Todo como procesos independientes: puedes cerrar VS Code/terminal y sigue corriendo.
  Solo necesitas hacer el login de Cloudflare (1 vez, abre navegador).
.EXAMPLE
  .\boot.ps1              # Setup completo + arranque
  .\boot.ps1 -NoInstall   # Solo arrancar (si ya tienes todo instalado)
#>

param([switch]$NoInstall)

$root = Split-Path -Parent $PSCommandPath
$ErrorActionPreference = "Continue"
$frontendPort = 3000
$backendPort = 8000
$domain = "lablma.com"

function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red }

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
function Test-Winget { return (Get-Command winget -ErrorAction SilentlyContinue) -ne $null }

# ═══════════════════════════════════════════
# 1. INSTALAR DEPENDENCIAS DEL SISTEMA
# ═══════════════════════════════════════════
if (-not $NoInstall) {
    Write-Step "Verificando Python..."
    $pythonOk = $false; $pyCmd = $null
    foreach ($cmd in @("python", "python3")) {
        $exe = Get-Command $cmd -ErrorAction SilentlyContinue
        if ($exe) {
            try { $ver = & $cmd --version 2>&1; if ($ver -match "(\d+\.\d+)") { $v = [version]$Matches[1]; if ($v -ge [version]"3.12") { $pythonOk = $true; $pyCmd = $cmd; Write-Ok "Python $v"; break } } } catch {}
        }
    }
    if (-not $pythonOk) {
        if (-not $isAdmin) { Write-Warn "Se necesita instalar Python. Solicitando admin..."; Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait; exit }
        if (Test-Winget) { winget install --id Python.Python.312 -e --silent --accept-package-agreements 2>&1 | Out-Null; $pyCmd = "python"; Write-Ok "Python 3.12 instalado" }
        else { Write-Fail "winget no disponible. Instala Python manualmente"; exit 1 }
    }

    Write-Step "Verificando Node.js..."
    $nodeOk = $false
    try { $ver = & node --version 2>&1; if ($ver -match "v(\d+)") { if ([int]$Matches[1] -ge 20) { $nodeOk = $true; Write-Ok "Node.js $ver" } } } catch {}
    if (-not $nodeOk) {
        if (-not $isAdmin) { Write-Warn "Se necesita instalar Node.js. Solicitando admin..."; Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait; exit }
        if (Test-Winget) { winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements 2>&1 | Out-Null; Write-Ok "Node.js 20 LTS instalado" }
        else { Write-Fail "winget no disponible. Instala Node.js manualmente"; exit 1 }
    }
} else {
    $pyCmd = if (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { "python3" }
}

# ═══════════════════════════════════════════
# 2. BACKEND — venv + pip
# ═══════════════════════════════════════════
Write-Step "Configurando backend..."
$beDir = "$root\backend"
if (-not (Test-Path "$beDir\venv")) { & $pyCmd -m venv "$beDir\venv"; Write-Ok "venv creado" } else { Write-Ok "venv ya existe" }
& "$beDir\venv\Scripts\pip" install --upgrade pip -q 2>$null
& "$beDir\venv\Scripts\pip" install -r "$beDir\requirements.txt" -q
if ($LASTEXITCODE -eq 0) { Write-Ok "Dependencias Python instaladas" } else { Write-Fail "Error en pip install"; exit 1 }

# ═══════════════════════════════════════════
# 3. FRONTEND — npm install
# ═══════════════════════════════════════════
Write-Step "Configurando frontend..."
$feDir = "$root\frontend"
if (-not (Test-Path "$feDir\node_modules")) {
    Set-Location $feDir; npm install --silent 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Ok "Dependencias Node.js instaladas" } else { Write-Fail "Error en npm install"; exit 1 }
} else { Write-Ok "node_modules ya existe" }

# ═══════════════════════════════════════════
# 4. .env FILES
# ═══════════════════════════════════════════
Write-Step "Configurando entorno..."
$beEnv = "$root\backend\.env"
if (-not (Test-Path $beEnv)) {
@"
DATABASE_URL=sqlite+aiosqlite:///../data/sgc.db
SECRET_KEY=sgc-dev-$( -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 24 | % {[char]$_}) )
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
SMTP_HOST=smtp.gmail.com; SMTP_PORT=587; SMTP_USER=; SMTP_PASSWORD=
SMTP_FROM=SGC <noreply@sgc.local>
WHATSAPP_TOKEN=; WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NC=alerta_nc; WHATSAPP_TEMPLATE_DOC=alerta_documento
FRONTEND_URL=http://localhost:${frontendPort}
ENVIRONMENT=development
CRON_SECRET=$( -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 32 | % {[char]$_}) )
"@ | Set-Content $beEnv -Encoding UTF8; Write-Ok ".env backend creado"
} else { Write-Ok ".env backend OK" }

$feEnv = "$root\frontend\.env.local"
if (-not (Test-Path $feEnv)) {
@"
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME=SGC - Sistema de Gestión de Calidad
"@ | Set-Content $feEnv -Encoding UTF8; Write-Ok ".env.local frontend creado"
} else { Write-Ok ".env.local frontend OK" }

# ═══════════════════════════════════════════
# 5. DIRECTORIOS
# ═══════════════════════════════════════════
Write-Step "Preparando almacenamiento..."
New-Item -ItemType Directory -Path "$root\data" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\backend\documentos_edicion" -Force | Out-Null
Write-Ok "Directorios listos"

# ═══════════════════════════════════════════
# 6. FIREWALL
# ═══════════════════════════════════════════
if ($isAdmin) {
    Write-Step "Abriendo puertos en firewall..."
    if (-not (Get-NetFirewallRule -DisplayName "SGC-Backend" -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName "SGC-Backend" -Direction Inbound -Protocol TCP -LocalPort $backendPort -Action Allow -Profile Any | Out-Null }
    if (-not (Get-NetFirewallRule -DisplayName "SGC-Frontend" -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName "SGC-Frontend" -Direction Inbound -Protocol TCP -LocalPort $frontendPort -Action Allow -Profile Any | Out-Null }
    Write-Ok "Puertos abiertos en firewall"
} else { Write-Warn "No eres admin. Saltando firewall (abre puertos 3000 y 8000 manualmente)" }

# ═══════════════════════════════════════════
# 7. MIGRACIONES + SEED
# ═══════════════════════════════════════════
Write-Step "Preparando base de datos..."
$venv = "$beDir\venv\Scripts\python.exe"
Set-Location $beDir
& $venv -m alembic upgrade head 2>&1
if ($LASTEXITCODE -ne 0) { & $venv -c "from app.database import engine, Base; import app.models.usuario, app.models.documento, app.models.version_documento, app.models.historial_documento, app.models.no_conformidad, app.models.plan_accion, app.models.riesgo, app.models.plan_programa, app.models.tarea_plan, app.models.notificacion; import asyncio; asyncio.run(Base.metadata.create_all(engine))" 2>&1 }
& $venv -m app.seed 2>&1
Write-Ok "Base de datos lista"

# ═══════════════════════════════════════════
# 8. CLOUDFLARE TUNNEL
# ═══════════════════════════════════════════
Write-Step "Configurando Cloudflare Tunnel (${domain})..."
$cfPath = "$env:USERPROFILE\cloudflared.exe"
$cfInstalled = Test-Path $cfPath
$cfLogged = Test-Path "$env:USERPROFILE\.cloudflared\cert.pem"
$tunnelExists = $false

if ($cfInstalled) { try { if (& $cfPath tunnel list 2>&1 | Select-String "sgc") { $tunnelExists = $true } } catch {} }

if (-not $cfInstalled) {
    Write-Host "  Descargando cloudflared..."
    try {
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cfPath -UseBasicParsing -ErrorAction Stop
        $cfInstalled = $true
        Write-Ok "cloudflared descargado"
    } catch { Write-Warn "No se pudo descargar cloudflared" }
}

if ($cfInstalled -and -not $cfLogged) {
    Write-Host "  IMPORTANTE: Se abrira el navegador para vincular tu cuenta Cloudflare." -ForegroundColor Yellow
    Write-Host "  Inicia sesion y autoriza. Es SOLO LA PRIMERA VEZ." -ForegroundColor Yellow
    Write-Host "  Presiona ENTER para continuar..." -ForegroundColor Cyan
    $null = $host.UI.RawUI.ReadKey("IncludeKeyDown")
    try {
        Start-Process -FilePath $cfPath -ArgumentList "tunnel login" -Wait
        $cfLogged = Test-Path "$env:USERPROFILE\.cloudflared\cert.pem"
        if ($cfLogged) { Write-Ok "Cloudflare autenticado correctamente" } else { Write-Warn "No se completo el login" }
    } catch { Write-Warn "Error en login de Cloudflare" }
}

if ($cfInstalled -and $cfLogged -and -not $tunnelExists) {
    Write-Host "  Creando tunnel 'sgc'..."
    try {
        & $cfPath tunnel create sgc 2>&1 | Out-Null
        $tunnelId = & $cfPath tunnel list 2>&1 | Where-Object { $_ -match "sgc" } | ForEach-Object { ($_ -split '\s+')[0] }
        if (-not $tunnelId) { $tunnelId = "sgc" }
@"
tunnel: $tunnelId
credentials-file: $env:USERPROFILE\.cloudflared\${tunnelId}.json
ingress:
  - hostname: ${domain}
    service: http://localhost:${frontendPort}
  - hostname: www.${domain}
    service: http://localhost:${frontendPort}
  - hostname: api.${domain}
    service: http://localhost:${backendPort}
  - service: http_status:404
"@ | Set-Content -Path "$env:USERPROFILE\.cloudflared\config.yml" -Encoding UTF8 -Force
        $tunnelExists = $true
        Write-Ok "Tunnel 'sgc' creado"
        Write-Host "  Agrega estos registros DNS en cloudflare.com:" -ForegroundColor Yellow
        Write-Host "    ${domain}       CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
        Write-Host "    www.${domain}   CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
        Write-Host "    api.${domain}   CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
    } catch { Write-Warn "Error creando tunnel: $_" }
}

# ═══════════════════════════════════════════
# 9. INICIAR SERVICIOS
# ═══════════════════════════════════════════
Write-Step "Iniciando servicios..."
& "$root\scripts\start-all.ps1"
Write-Ok "Servicios iniciados"

# ═══════════════════════════════════════════
# 10. INSTALAR AUTO-INICIO CON WINDOWS
# ═══════════════════════════════════════════
if ($isAdmin) {
    Write-Step "Configurando inicio automatico con Windows..."
    $existing = Get-ScheduledTask -TaskName "SGC-Server" -ErrorAction SilentlyContinue
    if (-not $existing) {
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$root\scripts\start-all.ps1`""
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -Priority 5
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        Register-ScheduledTask -TaskName "SGC-Server" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
        Write-Ok "Tarea 'SGC-Server' instalada. Inicia automaticamente al encender la PC."
    } else {
        Write-Ok "Tarea 'SGC-Server' ya existe (se inicia con Windows)"
    }
} else {
    Write-Warn "No eres admin. Para auto-inicio con Windows, ejecuta como admin:"
    Write-Host "    Start-ScheduledTask -TaskName 'SGC-Server'"
}

# ═══════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════
$lanIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -ExpandProperty IPAddress

Write-Step "=== SGC LISTO ==="
Write-Host ""
Write-Host "  Accesos:" -ForegroundColor Cyan
Write-Host "    http://localhost:${frontendPort}" -ForegroundColor Green
foreach ($ip in $lanIPs) { Write-Host "    http://${ip}:${frontendPort}" -ForegroundColor Green }
if ($cfInstalled -and $cfLogged -and $tunnelExists) { Write-Host "    https://${domain}" -ForegroundColor Green }
Write-Host ""
Write-Host "  Credenciales demo:" -ForegroundColor Yellow
Write-Host "    admin@sgc.local / Admin1234!" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para detener: .\scripts\stop-all.ps1" -ForegroundColor Yellow
Write-Host "  Para actualizar desde tu portatil: git push (auto-deploy activo)" -ForegroundColor Yellow
Write-Host "  Para ver logs: dir .\logs\" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Puedes cerrar VS Code / terminal. Los servicios siguen corriendo." -ForegroundColor Cyan
Write-Host "  Al reiniciar la PC, SGC arranca solo." -ForegroundColor Cyan
