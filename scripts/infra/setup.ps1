param(
    [switch]$NoTunnel,
    [switch]$NoService,
    [switch]$NoBuild,
    [switch]$Quick
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
$InfraDir = Join-Path $ProjectRoot "scripts\infra"
$LogDir = Join-Path $ProjectRoot "logs"
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

foreach ($dir in @($LogDir, (Join-Path $ProjectRoot "data"))) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

$setupLog = Join-Path $LogDir "setup.log"
$startTime = Get-Date

function Write-Step {
    param([string]$Msg, [string]$Status = "RUNNING")
    $time = Get-Date -Format "HH:mm:ss"
    $icon = switch ($Status) {
        "OK" { "✓" }
        "ERROR" { "✗" }
        "SKIP" { "→" }
        default { "○" }
    }
    $color = switch ($Status) {
        "OK" { "Green" }
        "ERROR" { "Red" }
        "SKIP" { "Yellow" }
        default { "Cyan" }
    }
    Write-Host "[$time] $icon $Msg" -ForegroundColor $color
    "[$time] [$Status] $Msg" | Out-File -FilePath $setupLog -Append -Encoding UTF8
}

function Confirm-Step {
    param([string]$Msg)
    Write-Host "`n$Msg" -ForegroundColor Yellow
    $key = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
    return $key.Character -eq 'y' -or $key.Character -eq 'Y' -or $key.Character -eq ' '
}

try {
    Write-Host "
╔══════════════════════════════════════════════╗
║     SGC — INFRASTRUCTURE SETUP v1.0         ║
║     Sistema de Gestión de Calidad            ║
║     Dominio: lablma.com                      ║
╚══════════════════════════════════════════════╝
" -ForegroundColor Magenta

    # ─── STEP 1: Admin check ───
    Write-Step "Checking administrator privileges..."
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Step "This script needs Administrator privileges for firewall and service." "ERROR"
        Write-Step "Restart as Administrator and try again." "ERROR"
        exit 1
    }
    Write-Step "Administrator OK" "OK"

    # ─── STEP 2: Requirements ───
    Write-Step "Checking requirements..."

    $hasNode = Get-Command node -ErrorAction SilentlyContinue
    if (-not $hasNode) { Write-Step "Node.js not found. Install from https://nodejs.org" "ERROR"; exit 1 }
    Write-Step "Node.js: $((node --version))" "OK"

    $hasPython = Get-Command python -ErrorAction SilentlyContinue
    if (-not $hasPython) { $hasPython = Get-Command python3 -ErrorAction SilentlyContinue }
    if (-not $hasPython) { Write-Step "Python not found" "ERROR"; exit 1 }
    Write-Step "Python: $(& $hasPython.Source --version 2>&1)" "OK"

    $hasGit = Get-Command git -ErrorAction SilentlyContinue
    if (-not $hasGit) { Write-Step "Git not found. Install from https://git-scm.com" "ERROR"; exit 1 }
    Write-Step "Git: $((git --version))" "OK"

    # ─── STEP 3: Python venv ───
    Write-Step "Setting up Python virtual environment..."
    $venvPath = Join-Path $BackendDir "venv"
    if (-not (Test-Path $venvPath)) {
        & python -m venv $venvPath
        Write-Step "Virtual environment created" "OK"
    } else {
        Write-Step "Virtual environment exists" "OK"
    }

    Write-Step "Installing Python dependencies..."
    & "$venvPath\Scripts\pip.exe" install -r "$BackendDir\requirements.txt" -q 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Python dependencies installed" "OK"
    } else {
        Write-Step "pip install failed" "ERROR"
    }

    # ─── STEP 4: NPM dependencies ───
    Write-Step "Installing frontend dependencies..."
    & npm.cmd --prefix "$FrontendDir" install 2>&1 | Out-Null
    Write-Step "Frontend dependencies installed" "OK"

    # ─── STEP 5: Network detection & firewall ───
    Write-Step "Configuring network..."
    . "$InfraDir\network.ps1"

    $lanIPs = Get-LanIPs
    $lanIP = $lanIPs | Where-Object { $_ -ne "127.0.0.1" } | Select-Object -First 1
    if (-not $lanIP) { $lanIP = "localhost" }
    Write-Step "LAN IP detected: $lanIP" "OK"

    $publicIP = Get-PublicIP
    if ($publicIP) {
        Write-Step "Public IP detected: $publicIP" "OK"
    } else {
        Write-Step "Public IP not detectable (ok for now)" "SKIP"
    }

    $fwCount = Set-FirewallSGC -Action Add
    Write-Step "Firewall rules: $fwCount added" "OK"

    # ─── STEP 6: Generate .env files ───
    Write-Step "Generating .env configuration files..."
    Write-StartupEnv -ProjectRoot $ProjectRoot -Domain "lablma.com"
    Write-Step "Environment files generated" "OK"

    # ─── STEP 7: Migrations + Seed ───
    Write-Step "Running database migrations..."
    & "$venvPath\Scripts\python.exe" -m alembic upgrade head 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Migrations OK" "OK"
    } else {
        Write-Step "Migrations failed" "ERROR"
    }

    Write-Step "Seeding demo data..."
    & "$venvPath\Scripts\python.exe" -m app.seed 2>&1 | Out-Null
    Write-Step "Seed OK" "OK"

    # ─── STEP 8: Build frontend ───
    if (-not $NoBuild) {
        Write-Step "Building frontend for production..."
        $buildOut = & npm.cmd --prefix "$FrontendDir" run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Step "Frontend built" "OK"
        } else {
            Write-Step "Frontend build failed. Run manually: cd frontend && npm run build" "ERROR"
        }
    } else {
        Write-Step "Build skipped (-NoBuild)" "SKIP"
    }

    # ─── STEP 9: Cloudflare Tunnel (optional) ───
    if (-not $NoTunnel) {
        Write-Step "Setting up Cloudflare Tunnel..."
        Write-Host "`nDo you want to set up the Cloudflare Tunnel for external access? (Y/n)" -ForegroundColor Yellow
        $key = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Write-Host ""
        $setupTunnel = $key.Character -eq 'y' -or $key.Character -eq 'Y' -or $key.Character -eq ' ' -or $key.Character -eq "`r" -or $key.Character -eq "`n"

        if ($setupTunnel) {
            . "$InfraDir\tunnel.ps1" -Action install
            Write-Host "`nNext steps for the tunnel:" -ForegroundColor Yellow
            Write-Host "  1. npm run infra:tunnel:login    (authenticate with Cloudflare in browser)" -ForegroundColor Cyan
            Write-Host "  2. npm run infra:tunnel:create   (create tunnel and DNS records)" -ForegroundColor Cyan
            Write-Host "  3. npm run infra:tunnel:start    (start the tunnel)" -ForegroundColor Cyan
        } else {
            Write-Step "Tunnel setup skipped" "SKIP"
        }
    }

    # ─── STEP 10: Install Windows service ───
    if (-not $NoService) {
        Write-Step "Installing Windows service (auto-start at boot)..."
        & "$ProjectRoot\scripts\install-service.ps1" | Out-Null
        Write-Step "Windows service 'SGC-Server' installed" "OK"
    } else {
        Write-Step "Service installation skipped" "SKIP"
    }

    # ─── STEP 11: Git remote ───
    Write-Step "Checking git remote..."
    $remoteUrl = & git -C $ProjectRoot remote get-url origin 2>$null
    if (-not $remoteUrl) {
        Write-Host "`nNo git remote configured." -ForegroundColor Yellow
        $repoUrl = Read-Host "Enter your GitHub repository URL (or press Enter to skip)"
        if ($repoUrl) {
            & git -C $ProjectRoot remote add origin $repoUrl 2>&1 | Out-Null
            Write-Step "Remote added: $repoUrl" "OK"
        } else {
            Write-Step "Git remote skipped (can be added later)" "SKIP"
        }
    } else {
        Write-Step "Git remote: $remoteUrl" "OK"
    }

    # ─── SUMMARY ───
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds, 0)
    Write-Host "
╔══════════════════════════════════════════════╗
║           SETUP COMPLETE ($elapsed s)          ║
╚══════════════════════════════════════════════╝
" -ForegroundColor Magenta

    Show-NetworkURLs -Domain "lablma.com" -FrontendPort 3000 -BackendPort 8000

    Write-Host "COMMANDS:" -ForegroundColor Yellow
    Write-Host "  Start server:     npm start" -ForegroundColor Cyan
    Write-Host "  Start + tunnel:   npm run infra:start" -ForegroundColor Cyan
    Write-Host "  Push & deploy:    npm run sync" -ForegroundColor Cyan
    Write-Host "  Monitor:          npm run infra:monitor" -ForegroundColor Cyan
    Write-Host "  Stop server:      npm stop" -ForegroundColor Cyan
    Write-Host "  View status:      npm run status" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Write-Step "SETUP FAILED: $_" "ERROR"
    exit 1
}
