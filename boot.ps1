param([switch]$Elevated)

$root = Split-Path -Parent $PSCommandPath
$ErrorActionPreference = "Continue"
$frontendPort = 3000
$backendPort = 8000
$domain = "lablma.com"
$logFile = "$root\logs\boot.log"
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not (Test-Path "$root\logs")) { New-Item -ItemType Directory -Path "$root\logs" -Force | Out-Null }

# ─── SI NO ES ADMIN → relanzar como admin + TAIL del log ───
if (-not $isAdmin -and -not $Elevated) {
    if (Test-Path $logFile) { Remove-Item $logFile -Force }
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  SGC BOOT - Solicitando permisos de admin" -ForegroundColor Yellow
    Write-Host "  (Acepta UAC. Progreso visible AQUI abajo.)" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Cyan
    $proc = Start-Process powershell.exe "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Elevated" -Verb RunAs -PassThru
    $lastSize = 0
    while (-not $proc.HasExited) {
        if (Test-Path $logFile) {
            try {
                $lines = Get-Content $logFile -Encoding UTF8
                if ($null -ne $lines -and @($lines).Count -gt $lastSize) {
                    @($lines)[$lastSize..(@($lines).Count-1)] | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
                    $lastSize = @($lines).Count
                }
            } catch { }
        }
        Start-Sleep -Milliseconds 400
    }
    try { if (Test-Path $logFile) { Get-Content $logFile -Encoding UTF8 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray } } } catch {}
    Write-Host "`nProceso admin finalizado. Presiona ENTER para salir..." -ForegroundColor Cyan
    $null = $host.UI.RawUI.ReadKey("IncludeKeyDown")
    exit
}

# ══════════════════════════════════════════════
# A PARTIR DE AQUI: CORRE COMO ADMIN
# ══════════════════════════════════════════════
if (Test-Path $logFile) { Remove-Item $logFile -Force }

function Log {
    param($m)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts - $m" | Add-Content $logFile -Encoding UTF8
}
function Write-Step($m)  { Write-Host "`n>> $m" -ForegroundColor Cyan; Log $m }
function Write-Ok($m)    { Write-Host "  [OK] $m" -ForegroundColor Green; Log "OK: $m" }
function Write-Warn($m)  { Write-Host "  [!] $m" -ForegroundColor Yellow; Log "WARN: $m" }
function Write-Fail($m)  { Write-Host "  [FAIL] $m" -ForegroundColor Red; Log "FAIL: $m" }
function Write-Info($m)  { Write-Host "  $m" -ForegroundColor Gray; Log $m }

function Wait-Exit {
    Write-Host ""; Write-Host "  Presiona ENTER para cerrar..." -ForegroundColor Cyan
    $null = $host.UI.RawUI.ReadKey("IncludeKeyDown")
}

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Test-Cmd($Name) { return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue) }

function Find-Python {
    foreach ($c in @("python", "python3", "py")) {
        if (Test-Cmd $c) {
            try { $v = & $c --version 2>&1 } catch { continue }
            if ($v -match "(\d+\.\d+)") {
                $ver = [version]$Matches[1]
                if ($ver -ge [version]"3.12") { Write-Info "Python $ver encontrado ($c)"; return $c }
            }
        }
    }
    return $null
}

function Find-Node {
    if (Test-Cmd node) {
        try { $v = & node --version 2>&1 } catch { return $false }
        if ($v -match "v(\d+)") { return ([int]$Matches[1] -ge 20) }
    }
    return $false
}

function Run-Silent($FilePath, $Args, $Label) {
    Write-Info "$Label..."
    $p = Start-Process -FilePath $FilePath -ArgumentList $Args -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0 -and $p.ExitCode -ne 3010) {
        Write-Warn "$Label -> exit code $($p.ExitCode)"
    }
    return $p.ExitCode
}

function Install-Python-Silent {
    if (Test-Cmd winget) {
        foreach ($id in @("Python.Python", "Python.Python.3.12", "Python.Python.312", "Python.Python.3")) {
            Write-Info "winget: buscando $id..."
            winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements *>$null
            $ok = ($LASTEXITCODE -eq 0)
            Refresh-Path
            if ($ok -and (Find-Python)) { Write-Ok "Python instalado via winget ($id)"; return }
        }
        Write-Warn "winget no encontro Python. Usando descarga directa..."
    }

    Write-Info "Descargando Python 3.12 desde python.org..."
    $installer = "$root\data\python-3.12.7-amd64.exe"
    if (-not (Test-Path "$root\data")) { New-Item -ItemType Directory -Path "$root\data" -Force | Out-Null }
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.12.7/python-3.12.7-amd64.exe" -OutFile $installer -UseBasicParsing
        Write-Info "Descarga completa. Instalando..."
        Run-Silent $installer "/quiet InstallAllUsers=1 PrependPath=1 Include_test=0" "Instalador Python"
        Refresh-Path
        if (Find-Python) { Write-Ok "Python instalado"; return }
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Program Files\Python312;C:\Program Files\Python312\Scripts"
        if (Find-Python) { Write-Ok "Python encontrado tras refresh PATH"; return }
    } catch { Write-Fail "Error descarga/instalacion: $_" }

    Write-Fail "No se pudo instalar Python. Hazlo manual desde python.org (marca Add Python to PATH)"
    Wait-Exit; exit 1
}

function Install-Node-Silent {
    if (Test-Cmd winget) {
        foreach ($id in @("OpenJS.NodeJS.LTS", "OpenJS.NodeJS", "OpenJS.NodeJS.20", "OpenJS.NodeJS.21")) {
            Write-Info "winget: buscando $id..."
            winget install --id $id -e --silent --accept-package-agreements --accept-source-agreements *>$null
            $ok = ($LASTEXITCODE -eq 0)
            Refresh-Path
            if ($ok -and (Find-Node)) { Write-Ok "Node.js instalado via winget ($id)"; return }
        }
        Write-Warn "winget no encontro Node.js. Usando descarga directa..."
    }

    Write-Info "Descargando Node.js 20 LTS desde nodejs.org..."
    $installer = "$root\data\node-v20.18.0-x64.msi"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi" -OutFile $installer -UseBasicParsing
        Write-Info "Descarga completa. Instalando..."
        Run-Silent "msiexec.exe" "/i `"$installer`" /qn /norestart" "Instalador Node.js MSI"
        Refresh-Path
        if (Find-Node) { Write-Ok "Node.js instalado"; return }
    } catch { Write-Warn "Error MSI: $_" }

    $installerExe = "$root\data\node-v20.18.0-x64.exe"
    try {
        Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.exe" -OutFile $installerExe -UseBasicParsing
        Write-Info "Instalando via EXE..."
        Run-Silent $installerExe "/S" "Instalador Node.js EXE"
        Refresh-Path
        if (Find-Node) { Write-Ok "Node.js instalado"; return }
    } catch { Write-Warn "Error EXE: $_" }

    Write-Fail "No se pudo instalar Node.js. Hazlo manual desde nodejs.org"
    Wait-Exit; exit 1
}

# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════
Log "INICIADO como ADMIN | Elevated=$Elevated | Root=$root"

# ── 1. Python ──
Write-Step "Verificando Python..."
$pyCmd = Find-Python
if (-not $pyCmd) { Install-Python-Silent; $pyCmd = "python"; Refresh-Path }

# ── 2. Node.js ──
Write-Step "Verificando Node.js..."
if (-not (Find-Node)) { Install-Node-Silent }

# ── 3. Backend venv ──
Write-Step "Configurando backend..."
$beDir = "$root\backend"
$venvPython = "$beDir\venv\Scripts\python.exe"
$venvPip = "$beDir\venv\Scripts\python.exe"

if (-not (Test-Path "$beDir\venv")) {
    Write-Info "Creando venv..."
    & $pyCmd -m venv "$beDir\venv" 2>&1 | ForEach-Object { Write-Info "  $_" }
    Write-Ok "venv creado"
} else { Write-Ok "venv ya existe" }

Write-Info "pip install --upgrade pip..."
& $venvPip -m pip install --upgrade pip -q 2>$null

Write-Info "Instalando dependencias Python..."
$reqFile = "$beDir\requirements.txt"
if (Test-Path $reqFile) {
    $reqs = Get-Content $reqFile | Where-Object { $_ -match '^[a-zA-Z0-9]' -and $_ -notmatch '^#' -and $_ -match '==' }
    $failed = @()
    foreach ($req in $reqs) {
        $pkg = ($req -split '==')[0]
        Write-Info "  pip install $pkg..."
        $output = & $venvPip -m pip install $req 2>&1
        $output | ForEach-Object { Log "    $_" }
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "  $pkg FALLO (se salta)"
            $failed += $pkg
        }
    }
    if ($failed.Count -eq 0) {
        Write-Ok "Todas las dependencias Python instaladas"
    } else {
        Write-Warn "Paquetes que fallaron: $($failed -join ', ')"
        Write-Warn "Pueden ser opcionales o requerir dependencias del sistema"
        Write-Ok "Resto de dependencias OK"
    }
} else {
    Write-Fail "No encontrado: $reqFile"
    Wait-Exit; exit 1
}

# ── 4. Frontend npm ──
Write-Step "Configurando frontend..."
$feDir = "$root\frontend"
if (-not (Test-Path "$feDir\node_modules")) {
    Write-Info "npm install..."
    Push-Location $feDir
    $npmOut = npm install 2>&1
    $npmOut | ForEach-Object { Log "  $_" }
    Pop-Location
    if ($LASTEXITCODE -eq 0) { Write-Ok "Dependencias Node.js OK" } else { Write-Fail "Error en npm install"; Wait-Exit; exit 1 }
} else { Write-Ok "node_modules ya existe" }

# ── 5. .env files ──
Write-Step "Configurando entorno..."
$beEnv = "$root\backend\.env"
if (-not (Test-Path $beEnv)) {
    $secretKey = -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 24 | % { [char]$_ })
    $cronSecret = -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 32 | % { [char]$_ })
    @"
DATABASE_URL=sqlite+aiosqlite:///../data/sgc.db
SECRET_KEY=sgc-dev-$secretKey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
SMTP_HOST=smtp.gmail.com; SMTP_PORT=587; SMTP_USER=; SMTP_PASSWORD=
SMTP_FROM=SGC <noreply@sgc.local>
WHATSAPP_TOKEN=; WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NC=alerta_nc; WHATSAPP_TEMPLATE_DOC=alerta_documento
FRONTEND_URL=http://localhost:${frontendPort}
ENVIRONMENT=development
CRON_SECRET=$cronSecret
"@ | Set-Content $beEnv -Encoding UTF8; Write-Ok ".env backend creado"
} else { Write-Ok ".env backend OK" }

$feEnv = "$root\frontend\.env.local"
if (-not (Test-Path $feEnv)) {
    @"
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME=SGC - Sistema de Gestion de Calidad
"@ | Set-Content $feEnv -Encoding UTF8; Write-Ok ".env.local frontend creado"
} else { Write-Ok ".env.local frontend OK" }

# ── 6. Directorios ──
Write-Step "Preparando almacenamiento..."
New-Item -ItemType Directory -Path "$root\data" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$root\backend\documentos_edicion" -Force | Out-Null
Write-Ok "Directorios listos"

# ── 7. Firewall ──
Write-Step "Abriendo puertos en firewall..."
try {
    $null = Get-NetFirewallRule -DisplayName "SGC-Backend" -ErrorAction SilentlyContinue
    if (-not $?) { New-NetFirewallRule -DisplayName "SGC-Backend" -Direction Inbound -Protocol TCP -LocalPort $backendPort -Action Allow -Profile Any | Out-Null }
    $null = Get-NetFirewallRule -DisplayName "SGC-Frontend" -ErrorAction SilentlyContinue
    if (-not $?) { New-NetFirewallRule -DisplayName "SGC-Frontend" -Direction Inbound -Protocol TCP -LocalPort $frontendPort -Action Allow -Profile Any | Out-Null }
    Write-Ok "Puertos abiertos en firewall"
} catch { Write-Warn "Firewall: $_" }

# ── 8. Base de datos ──
Write-Step "Preparando base de datos..."
Push-Location $beDir
Write-Info "alembic upgrade head..."
$alembicOut = & $venvPython -m alembic upgrade head 2>&1
$alembicOut | ForEach-Object { Log "  alembic: $_" }
if ($LASTEXITCODE -ne 0) {
    Write-Info "alembic no disponible. Creando tablas directamente..."
    $directOut = & $venvPython -c "from app.database import engine, Base; import app.models.usuario, app.models.documento, app.models.version_documento, app.models.historial_documento, app.models.no_conformidad, app.models.plan_accion, app.models.riesgo, app.models.plan_programa, app.models.tarea_plan, app.models.notificacion; import asyncio; asyncio.run(Base.metadata.create_all(engine))" 2>&1
    $directOut | ForEach-Object { Log "  $_" }
}
Write-Info "app.seed..."
& $venvPython -m app.seed 2>&1 | ForEach-Object { Log "  seed: $_" }
Pop-Location
Write-Ok "Base de datos lista"

# ── 9. Cloudflare Tunnel ──
Write-Step "Configurando Cloudflare Tunnel (${domain})..."
$cfPath = "$env:USERPROFILE\cloudflared.exe"
$cfInstalled = Test-Path $cfPath
$cfLogged = Test-Path "$env:USERPROFILE\.cloudflared\cert.pem"
$tunnelExists = $false
if ($cfInstalled) {
    try { if (& $cfPath tunnel list 2>&1 | Select-String "sgc") { $tunnelExists = $true } } catch {}
}
if (-not $cfInstalled) {
    Write-Info "Descargando cloudflared..."
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cfPath -UseBasicParsing
        $cfInstalled = $true; Write-Ok "cloudflared descargado"
    } catch { Write-Warn "No se pudo descargar cloudflared: $_" }
}
if ($cfInstalled -and -not $cfLogged) {
    Write-Host "  Se abrira navegador para Cloudflare (SOLO 1RA VEZ)." -ForegroundColor Yellow
    Write-Host "  Presiona ENTER..." -ForegroundColor Cyan
    $null = $host.UI.RawUI.ReadKey("IncludeKeyDown")
    try { Start-Process -FilePath $cfPath -ArgumentList "tunnel login" -Wait; $cfLogged = Test-Path "$env:USERPROFILE\.cloudflared\cert.pem"; if ($cfLogged) { Write-Ok "Cloudflare autenticado" } else { Write-Warn "No se completo el login" } } catch { Write-Warn "Error login: $_" }
}
if ($cfInstalled -and $cfLogged -and -not $tunnelExists) {
    Write-Info "Creando tunnel 'sgc'..."
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
        $tunnelExists = $true; Write-Ok "Tunnel 'sgc' creado"
        Write-Host "  Agrega estos DNS en cloudflare.com:" -ForegroundColor Yellow
        Write-Host "    ${domain}       CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
        Write-Host "    www.${domain}   CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
        Write-Host "    api.${domain}   CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
    } catch { Write-Warn "Error creando tunnel: $_" }
}

# ── 10. Iniciar servicios ──
Write-Step "Iniciando servicios..."
$startScript = "$root\scripts\start-all.ps1"
if (Test-Path $startScript) {
    & $startScript
    Write-Ok "Servicios iniciados"
} else { Write-Fail "No encontrado: $startScript" }

# ── 11. Auto-inicio ──
Write-Step "Configurando inicio automatico con Windows..."
$existing = Get-ScheduledTask -TaskName "SGC-Server" -ErrorAction SilentlyContinue
if (-not $existing) {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$root\scripts\start-all.ps1`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -Priority 5
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName "SGC-Server" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Write-Ok "Tarea 'SGC-Server' instalada"
} else { Write-Ok "Tarea 'SGC-Server' ya existe" }

# ── RESUMEN ──
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
Write-Host "  Para ver logs: dir .\logs\" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Puedes cerrar esta ventana. Los servicios siguen corriendo." -ForegroundColor Cyan
Write-Host "  Al reiniciar la PC, SGC arranca solo." -ForegroundColor Cyan
Write-Host ""
Log "BOOT COMPLETADO EXITOSAMENTE"
Wait-Exit
