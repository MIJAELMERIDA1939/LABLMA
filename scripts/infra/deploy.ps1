param(
    [switch]$NoPull,
    [switch]$NoBuild,
    [switch]$NoRestart
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$LogDir = Join-Path $ProjectRoot "logs"
$DeployLog = Join-Path $LogDir "deploy.log"
$ScriptName = "SGC-Deploy"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$time] [$Level] $Msg"
    $line | Out-File -FilePath $DeployLog -Append -Encoding UTF8
    if ($Level -eq "ERROR") { Write-Host $line -ForegroundColor Red }
    elseif ($Level -eq "WARN") { Write-Host $line -ForegroundColor Yellow }
    elseif ($Level -eq "OK") { Write-Host $line -ForegroundColor Green }
    else { Write-Host $line }
}

Write-Log "=== Deploy started ==="

# Step 1: Git pull
if (-not $NoPull) {
    Write-Log "Pulling latest code from git..."
    $pullOut = & git -C $ProjectRoot pull 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Git pull OK" "OK"
    } else {
        Write-Log "Git pull failed: $pullOut" "WARN"
    }
}

# Step 2: Python dependencies
Write-Log "Installing Python dependencies..."
$pipOut = & "$BackendDir\venv\Scripts\python.exe" -m pip install -r "$BackendDir\requirements.txt" -q 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Log "Python deps OK" "OK"
} else {
    Write-Log "Python deps failed" "ERROR"
}

# Step 3: Migrations
Write-Log "Running database migrations..."
$migrateOut = & "$BackendDir\venv\Scripts\python.exe" -m alembic upgrade head 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Log "Migrations OK" "OK"
} else {
    Write-Log "Migrations failed: $migrateOut" "ERROR"
}

# Step 4: Seed
Write-Log "Running seed..."
& "$BackendDir\venv\Scripts\python.exe" -m app.seed 2>&1 | Out-Null
Write-Log "Seed OK" "OK"

# Step 5: Frontend build
if (-not $NoBuild) {
    Write-Log "Building frontend..."
    $buildOut = & npm.cmd --prefix "$FrontendDir" run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Frontend build OK" "OK"
    } else {
        Write-Log "Frontend build failed" "ERROR"
    }
}

# Step 6: Restart services
if (-not $NoRestart) {
    Write-Log "Restarting services..."
    & "$ProjectRoot\scripts\stop-server.ps1" | Out-Null
    Start-Sleep -Seconds 2
    & "$ProjectRoot\scripts\infra\tunnel.ps1" -Action stop | Out-Null
    $job = Start-Job -ScriptBlock {
        param($root)
        & "$root\scripts\start-server.ps1"
    } -ArgumentList $ProjectRoot
    Write-Log "Services restarted" "OK"
}

Write-Log "=== Deploy completed ==="
