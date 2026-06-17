function Get-LanIPs {
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -like '192.168.*' -or
        $_.IPAddress -like '10.*' -or
        ($_.IPAddress -like '172.*' -and [int]($_.IPAddress -split '\.')[1] -ge 16 -and [int]($_.IPAddress -split '\.')[1] -le 31)
    } | Select-Object -ExpandProperty IPAddress
    if (-not $ips) { $ips = @("127.0.0.1") }
    return $ips
}

function Get-PublicIP {
    try {
        $resp = Invoke-WebRequest -Uri "https://api.ipify.org?format=json" -TimeoutSec 5 -UseBasicParsing
        $data = $resp.Content | ConvertFrom-Json
        return $data.ip
    } catch {
        return $null
    }
}

function Set-FirewallSGC {
    param([string]$Action = "Add")
    $rules = @(
        @{ Name = "SGC-Backend"; Port = 8000 },
        @{ Name = "SGC-Frontend"; Port = 3000 }
    )
    $count = 0
    foreach ($rule in $rules) {
        $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
        if ($Action -eq "Add" -and -not $existing) {
            New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol TCP -LocalPort $rule.Port -Action Allow -Profile Any | Out-Null
            $count++
        } elseif ($Action -eq "Remove" -and $existing) {
            Remove-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
            $count++
        }
    }
    return $count
}

function Show-NetworkURLs {
    param(
        [string]$Domain,
        [int]$FrontendPort = 3000,
        [int]$BackendPort = 8000
    )
    $ips = Get-LanIPs
    Write-Host "`n========== ACCESO A LA RED ==========" -ForegroundColor Cyan
    Write-Host "  LOCAL`t`thttp://localhost:${FrontendPort}" -ForegroundColor Green
    Write-Host "  API`t`thttp://localhost:${BackendPort}/docs" -ForegroundColor Green
    foreach ($ip in $ips) {
        if ($ip -ne "127.0.0.1") {
            Write-Host "  LAN`t`thttp://${ip}:${FrontendPort}" -ForegroundColor Green
            Write-Host "  LAN API`thttp://${ip}:${BackendPort}/docs" -ForegroundColor Green
        }
    }
    if ($Domain) {
        Write-Host "  EXTERNO`thttps://${Domain}" -ForegroundColor Yellow
        Write-Host "  EXTERNO API`thttps://${Domain}/api/v1/docs" -ForegroundColor Yellow
    }
    Write-Host "=====================================`n" -ForegroundColor Cyan
}

function Test-PortAvailable {
    param([int]$Port)
    $tcp = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return ($null -eq $tcp)
}

function Write-StartupEnv {
    param(
        [string]$ProjectRoot,
        [string]$Domain,
        [int]$FrontendPort = 3000,
        [int]$BackendPort = 8000
    )
    $lanIPs = Get-LanIPs
    $lanIP = $lanIPs | Where-Object { $_ -ne "127.0.0.1" } | Select-Object -First 1
    if (-not $lanIP) { $lanIP = "localhost" }

    $backendEnv = @"
DATABASE_URL=sqlite+aiosqlite:///../data/sgc.db
SECRET_KEY=super-secret-key-change-in-production-min-32-char
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
FRONTEND_URL=http://localhost:${FrontendPort}
ENVIRONMENT=production
CRON_SECRET=$( -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ }) )
"@

    $frontendEnv = @"
NEXT_PUBLIC_API_URL=http://localhost:${BackendPort}/api/v1
NEXT_PUBLIC_APP_NAME=SGC - Sistema de Gestión de Calidad
"@

    $backendEnv | Set-Content -Path (Join-Path $ProjectRoot "backend/.env") -Encoding UTF8 -Force
    $frontendEnv | Set-Content -Path (Join-Path $ProjectRoot "frontend/.env.local") -Encoding UTF8 -Force

    Write-Host "  .env files generated" -ForegroundColor Green
}
