param(
    [ValidateSet("dev", "prod", "status", "stop", "backup", "infra", "network", "tunnel", "boot")]
    [string]$Mode = "dev"
)

$root = Split-Path -Parent $PSCommandPath

switch ($Mode) {
    "boot" {
        & "$root\boot.ps1"
    }
    "dev" {
        Write-Host "=== SGC - Development Mode ===" -ForegroundColor Cyan

        $lanIPs = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } | Select-Object -ExpandProperty IPAddress

        $backendJob = Start-Job -ScriptBlock {
            Set-Location "$using:root\backend"
            .\venv\Scripts\activate; alembic upgrade head; python -m app.seed; uvicorn app.main:app --host 0.0.0.0 --reload --port 8000
        }

        $frontendJob = Start-Job -ScriptBlock {
            Set-Location "$using:root\frontend"
            npm run dev -- --host 0.0.0.0
        }

        Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
        Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
        foreach ($ip in $lanIPs) {
            Write-Host "LAN:     http://${ip}:3000" -ForegroundColor Green
        }
        Write-Host ""
        Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Red

        try {
            while ($true) {
                Start-Sleep -Seconds 1
                Receive-Job $backendJob -ErrorAction SilentlyContinue
                Receive-Job $frontendJob -ErrorAction SilentlyContinue
                if ($backendJob.State -eq "Failed") {
                    Write-Host "Backend failed. Check output above." -ForegroundColor Red
                    break
                }
                if ($frontendJob.State -eq "Failed") {
                    Write-Host "Frontend failed. Check output above." -ForegroundColor Red
                    break
                }
            }
        } finally {
            Stop-Job $backendJob -ErrorAction SilentlyContinue
            Stop-Job $frontendJob -ErrorAction SilentlyContinue
            Remove-Job $backendJob -ErrorAction SilentlyContinue
            Remove-Job $frontendJob -ErrorAction SilentlyContinue
        }
    }
    "prod" {
        & "$root\scripts\start-server.ps1"
    }
    "stop" {
        & "$root\scripts\stop-server.ps1"
    }
    "backup" {
        & "$root\scripts\backup.ps1"
    }
    "status" {
        $be = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "uvicorn" }
        $fe = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next" }
        $task = Get-ScheduledTask -TaskName "SGC-Server" -ErrorAction SilentlyContinue

        Write-Host "=== SGC Status ===" -ForegroundColor Cyan
        if ($be) { Write-Host "Backend:  RUNNING (PID $($be.ProcessId))" -ForegroundColor Green }
        else { Write-Host "Backend:  STOPPED" -ForegroundColor Red }
        if ($fe) { Write-Host "Frontend: RUNNING (PID $($fe.ProcessId))" -ForegroundColor Green }
        else { Write-Host "Frontend: STOPPED" -ForegroundColor Red }
        if ($task) { Write-Host "Service:  $($task.State)" -ForegroundColor Yellow }
        else { Write-Host "Service:  NOT INSTALLED" -ForegroundColor Gray }
    }
    "infra" {
        . "$root\scripts\infra\network.ps1"
        Write-Host "=== SGC - Infrastructure Mode ===" -ForegroundColor Magenta
        & "$root\scripts\start-server.ps1"
        . "$root\scripts\infra\tunnel.ps1" -Action start
        Show-NetworkURLs -Domain "lablma.com"
        Write-Host "Monitor: npm run infra:monitor" -ForegroundColor Yellow
    }
    "network" {
        . "$root\scripts\infra\network.ps1"
        Show-NetworkURLs -Domain "lablma.com"
        $fwCount = Set-FirewallSGC -Action Add
        Write-Host "Firewall rules configured ($fwCount added)" -ForegroundColor Green
    }
    "tunnel" {
        . "$root\scripts\infra\tunnel.ps1" -Action status
    }
}
