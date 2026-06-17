param(
    [switch]$NoTunnel,
    [int]$Interval = 30,
    [int]$GitInterval = 60
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
$LogDir = Join-Path $ProjectRoot "logs"
$MonitorLog = Join-Path $LogDir "monitor.log"
$PidFile = Join-Path $LogDir "monitor.pid"

$restartCount = @{ backend = 0; frontend = 0 }
$maxRestarts = 3
$lastGitCheck = 0

$pid = [System.Diagnostics.Process]::GetCurrentProcess().Id
$pid | Out-File -FilePath $PidFile -Force

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$time] [$Level] $Msg"
    $line | Out-File -FilePath $MonitorLog -Append -Encoding UTF8
    if ($Level -eq "ERROR") { Write-Host $line -ForegroundColor Red }
    elseif ($Level -eq "WARN") { Write-Host $line -ForegroundColor Yellow }
    elseif ($Level -eq "OK") { Write-Host $line -ForegroundColor Green }
    else { Write-Host $line }
}

function Check-Service {
    param([string]$Name, [string]$Url, [int]$Port)
    try {
        $req = [System.Net.WebRequest]::Create("http://localhost:${Port}/")
        $req.Timeout = 5000
        $resp = $req.GetResponse()
        $resp.Close()
        return $true
    } catch {
        return $false
    }
}

function Restart-Service {
    param([string]$Name)
    if ($restartCount[$Name] -ge $maxRestarts) {
        Write-Log "MAX RESTARTS REACHED for $Name" "ERROR"
        return
    }
    $restartCount[$Name]++

    if ($Name -eq "backend") {
        $procs = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -match "uvicorn" }
        $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
        $beLog = Join-Path $LogDir "backend.log"
        $beErrLog = Join-Path $LogDir "backend-err.log"
        Start-Process -PassThru -FilePath "$ProjectRoot\backend\venv\Scripts\python.exe" `
            -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" `
            -WorkingDirectory "$ProjectRoot\backend" `
            -RedirectStandardOutput $beLog -RedirectStandardError $beErrLog -WindowStyle Hidden
        Write-Log "Backend restarted (attempt $($restartCount[$Name]))" "WARN"
    } elseif ($Name -eq "frontend") {
        $procs = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -match "next" }
        $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Seconds 2
        $feLog = Join-Path $LogDir "frontend.log"
        $feErrLog = Join-Path $LogDir "frontend-err.log"
        Start-Process -PassThru -FilePath "npx.cmd" `
            -ArgumentList "next start -p 3000" `
            -WorkingDirectory "$ProjectRoot\frontend" `
            -RedirectStandardOutput $feLog -RedirectStandardError $feErrLog -WindowStyle Hidden
        Write-Log "Frontend restarted (attempt $($restartCount[$Name]))" "WARN"
    }
}

function Check-GitUpdates {
    param([int]$Interval)
    $now = [int](Get-Date -UFormat %s)
    if ($now -lt ($lastGitCheck + $Interval)) { return }
    $lastGitCheck = $now

    try {
        & git -C $ProjectRoot fetch origin 2>&1 | Out-Null
        $local = & git -C $ProjectRoot rev-parse HEAD 2>$null
        $remote = & git -C $ProjectRoot rev-parse origin/main 2>$null
        if ($local -and $remote -and $local -ne $remote) {
            Write-Log "New commits detected! Deploying..." "OK"
            & "$ProjectRoot\scripts\infra\deploy.ps1" -NoRestart
            Restart-Service "backend"
            Restart-Service "frontend"
            $restartCount["backend"] = 0
            $restartCount["frontend"] = 0
            Write-Log "Auto-deploy complete" "OK"
        }
    } catch {
        Write-Log "Git check failed: $_" "WARN"
    }
}

Write-Log "=== Monitor started ==="

while ($true) {
    $beUp = Check-Service "backend" "/docs" 8000
    $feUp = Check-Service "frontend" "/" 3000

    if (-not $beUp) {
        Write-Log "Backend DOWN" "ERROR"
        Restart-Service "backend"
    } else {
        $restartCount["backend"] = 0
    }

    if (-not $feUp) {
        Write-Log "Frontend DOWN" "ERROR"
        Restart-Service "frontend"
    } else {
        $restartCount["frontend"] = 0
    }

    Check-GitUpdates -Interval $GitInterval

    Start-Sleep -Seconds $Interval
}
