param(
    [switch]$NoBuild,
    [switch]$NoSeed,
    [switch]$ForceBuild
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$DataDir = Join-Path $ProjectRoot "data"
$LogDir = Join-Path $ProjectRoot "logs"

foreach ($dir in @($DataDir, $LogDir)) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

$lanIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*'
} | Select-Object -First 1).IPAddress
if (-not $lanIP) { $lanIP = "localhost" }

$logTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "[$logTime] === SGC Server ==="
Write-Host "[$logTime] LAN IP: $lanIP"
Write-Host "[$logTime] Backend: http://${lanIP}:8000"
Write-Host "[$logTime] Frontend: http://${lanIP}:3000"

# Backend: migrations
$migrateLog = Join-Path $LogDir "migrate.log"
Write-Host "[$logTime] Running migrations..."
$null = (& "$BackendDir\venv\Scripts\python.exe" -m alembic upgrade head 2>&1) *>> $migrateLog
if ($LASTEXITCODE -ne 0) {
    Write-Host "[$logTime] ERROR: Migrations failed. Check $migrateLog" -ForegroundColor Red
    Get-Content $migrateLog -Tail 10
    exit 1
}

# Backend: seed
if (-not $NoSeed) {
    Write-Host "[$logTime] Running seed..."
    $seedLog = Join-Path $LogDir "seed.log"
    $null = (& "$BackendDir\venv\Scripts\python.exe" -m app.seed 2>&1) *>> $seedLog
}

# Frontend: build (if needed)
$needsBuild = $ForceBuild -or -not (Test-Path "$FrontendDir\.next\BUILD_ID")
if ($NoBuild) { $needsBuild = $false }

if ($needsBuild) {
    Write-Host "[$logTime] Building frontend..."
    $buildLog = Join-Path $LogDir "build.log"
    $null = (& npm.cmd run build 2>&1) *>> $buildLog
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[$logTime] ERROR: Frontend build failed. Check $buildLog" -ForegroundColor Red
        Get-Content $buildLog -Tail 10
        exit 1
    }
}

# Kill any leftover processes on our ports
Write-Host "[$logTime] Cleaning previous processes..."
Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "uvicorn.*8000"
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "next.*3000"
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

# Start backend (production: no --reload, host 0.0.0.0)
Write-Host "[$logTime] Starting backend..."
$beLog = Join-Path $LogDir "backend.log"
$beErrLog = Join-Path $LogDir "backend-err.log"
$beProcess = Start-Process -PassThru -FilePath "$BackendDir\venv\Scripts\python.exe" `
    -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" `
    -WorkingDirectory $BackendDir `
    -RedirectStandardOutput $beLog -RedirectStandardError $beErrLog `
    -WindowStyle Hidden

Start-Sleep -Seconds 3
$beRunning = Get-CimInstance Win32_Process -Filter "ProcessId = $($beProcess.Id)" -ErrorAction SilentlyContinue
if (-not $beRunning) {
    Write-Host "[$logTime] ERROR: Backend failed to start. Checking logs..." -ForegroundColor Red
    if (Test-Path $beErrLog) { Get-Content $beErrLog -Tail 10 }
    exit 1
}

Write-Host "[$logTime] backend PID: $($beProcess.Id)"

# Start frontend
Write-Host "[$logTime] Starting frontend..."
$feLog = Join-Path $LogDir "frontend.log"
$feErrLog = Join-Path $LogDir "frontend-err.log"
$feProcess = Start-Process -PassThru -FilePath "npx.cmd" `
    -ArgumentList "next start -p 3000" `
    -WorkingDirectory $FrontendDir `
    -RedirectStandardOutput $feLog -RedirectStandardError $feErrLog `
    -WindowStyle Hidden

Start-Sleep -Seconds 3
Write-Host "[$logTime] frontend PID: $($feProcess.Id)"

Write-Host "[$logTime] Services running"
Write-Host "[$logTime] http://${lanIP}:8000/docs (API)"
Write-Host "[$logTime] http://${lanIP}:3000 (App)"

# Monitor — if either exits, stop both
$beProcess.WaitForExit()
$feProcess.WaitForExit()

Write-Host "[$logTime] A service stopped. Shutting down..."
Get-Process -Id $beProcess.Id -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Id $feProcess.Id -ErrorAction SilentlyContinue | Stop-Process -Force
