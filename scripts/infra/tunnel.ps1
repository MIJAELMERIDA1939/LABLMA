param(
    [ValidateSet("install", "login", "create", "start", "stop", "status", "uninstall")]
    [string]$Action = "status"
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
$InfraDir = Join-Path $ProjectRoot "scripts\infra"
$ConfigPath = Join-Path $InfraDir "config.json"
$LogDir = Join-Path $ProjectRoot "logs"
$TunnelLog = Join-Path $LogDir "tunnel.log"

$config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
$domain = $config.domain
$tunnelName = $config.cloudflare.tunnel_name
$frontendPort = $config.frontend_port

$cloudflaredPath = "cloudflared.exe"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$time] [$Level] $Msg"
    $line | Out-File -FilePath $TunnelLog -Append -Encoding UTF8
    if ($Level -eq "ERROR") { Write-Host $line -ForegroundColor Red }
    elseif ($Level -eq "OK") { Write-Host $line -ForegroundColor Green }
    elseif ($Level -eq "WARN") { Write-Host $line -ForegroundColor Yellow }
    else { Write-Host $line }
}

function Find-Cloudflared {
    $candidates = @(
        $cloudflaredPath,
        "$env:ProgramFiles\cloudflared\cloudflared.exe",
        "${env:LocalAppData}\cloudflare\cloudflared\cloudflared.exe",
        "${env:USERPROFILE}\.cloudflared\cloudflared.exe"
    )
    foreach ($c in $candidates) {
        if (Get-Command $c -ErrorAction SilentlyContinue) { return $c }
        if (Test-Path $c) { return $c }
    }
    # Also check common download locations
    $userPath = "${env:USERPROFILE}\cloudflared.exe"
    if (Test-Path $userPath) { return $userPath }
    return $null
}

function Install-Cloudflared {
    Write-Log "cloudflared not found. Downloading..." "WARN"
    $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    $outPath = "${env:USERPROFILE}\cloudflared.exe"
    try {
        Invoke-WebRequest -Uri $url -OutFile $outPath -UseBasicParsing
        Write-Log "Downloaded to $outPath" "OK"
        Set-Alias cf $outPath
        return $outPath
    } catch {
        Write-Log "Download failed: $_" "ERROR"
        Write-Host "Manually download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" -ForegroundColor Yellow
        return $null
    }
}

switch ($Action) {
    "install" {
        $cf = Find-Cloudflared
        if (-not $cf) {
            $cf = Install-Cloudflared
        } else {
            Write-Log "cloudflared already at: $cf" "OK"
        }
        if ($cf) {
            $global:cloudflaredPath = $cf
            & $cf version
        }
    }

    "login" {
        $cf = Find-Cloudflared
        if (-not $cf) { $cf = Install-Cloudflared }
        if (-not $cf) { exit 1 }

        Write-Host "Opening browser for Cloudflare login..." -ForegroundColor Yellow
        Start-Process "$cf" -ArgumentList "tunnel login"
        Write-Host "After login, the cert will be saved to ~/.cloudflared/" -ForegroundColor Yellow
        Write-Host "Then run: npm run infra:tunnel:create" -ForegroundColor Cyan
    }

    "create" {
        $cf = Find-Cloudflared
        if (-not $cf) { Write-Log "cloudflared not installed. Run 'install' first." "ERROR"; exit 1 }

        $existing = & $cf tunnel list 2>&1 | Select-String $tunnelName
        if ($existing) {
            Write-Log "Tunnel '$tunnelName' already exists" "WARN"
        } else {
            Write-Log "Creating tunnel '$tunnelName'..."
            & $cf tunnel create $tunnelName
            Write-Log "Tunnel created" "OK"
        }

        $tunnelId = & $cf tunnel list 2>&1 | Where-Object { $_ -match $tunnelName } | ForEach-Object { ($_ -split '\s+')[0] }
        if (-not $tunnelId) { $tunnelId = $tunnelName }

        Write-Log "Configuring DNS: ${domain} -> localhost:${frontendPort}"
        & $cf tunnel route dns $tunnelId $domain

        $configDir = "${env:USERPROFILE}\.cloudflared"
        $ymlPath = Join-Path $configDir "config.yml"
        $ymlContent = @"
tunnel: $tunnelId
credentials-file: ${configDir}/${tunnelId}.json
ingress:
  - hostname: ${domain}
    service: http://localhost:${frontendPort}
  - hostname: api.${domain}
    service: http://localhost:${frontendPort}
  - service: http_status:404
"@
        $ymlContent | Set-Content -Path $ymlPath -Encoding UTF8 -Force
        Write-Log "Config written to $ymlPath" "OK"
        Write-Host "`nIMPORTANTE: En el panel de Cloudflare, agrega estos registros DNS:" -ForegroundColor Yellow
        Write-Host "  ${domain}  CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
        Write-Host "  api.${domain}  CNAME  ${tunnelId}.cfargotunnel.com" -ForegroundColor Cyan
    }

    "start" {
        $cf = Find-Cloudflared
        if (-not $cf) { Write-Log "cloudflared not installed" "ERROR"; exit 1 }

        $proc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Log "Tunnel already running (PID $($proc.Id))" "WARN"
            return
        }

        Write-Log "Starting tunnel..."
        $logFile = Join-Path $LogDir "cloudflared.log"
        $p = Start-Process -PassThru -FilePath $cf -ArgumentList "tunnel run $tunnelName" -WindowStyle Hidden -RedirectStandardOutput $logFile -RedirectStandardError "${logFile}.err"
        Start-Sleep -Seconds 3
        if (-not $p.HasExited) {
            Write-Log "Tunnel started (PID $($p.Id))" "OK"
            Write-Host "Tunnel running. Access at: https://${domain}" -ForegroundColor Green
        } else {
            Write-Log "Tunnel failed to start" "ERROR"
            Get-Content $logFile -Tail 5
        }
    }

    "stop" {
        $procs = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($procs) {
            $procs | Stop-Process -Force
            Write-Log "Tunnel stopped" "OK"
        } else {
            Write-Log "No tunnel running" "WARN"
        }
    }

    "status" {
        $cf = Find-Cloudflared
        if (-not $cf) { Write-Host "cloudflared: NOT INSTALLED" -ForegroundColor Red; return }
        Write-Host "cloudflared: $cf" -ForegroundColor Green

        $proc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Tunnel: RUNNING (PID $($proc.Id))" -ForegroundColor Green
            Write-Host "URL: https://${domain}" -ForegroundColor Green
        } else {
            Write-Host "Tunnel: STOPPED" -ForegroundColor Red
        }

        Write-Host "`nCommands:" -ForegroundColor Yellow
        Write-Host "  npm run infra:tunnel:start" -ForegroundColor Cyan
        Write-Host "  npm run infra:tunnel:stop" -ForegroundColor Cyan
    }

    "uninstall" {
        $cf = Find-Cloudflared
        if ($cf) {
            & $cf tunnel delete $tunnelName
            Write-Log "Tunnel deleted" "OK"
            $configDir = "${env:USERPROFILE}\.cloudflared"
            Get-ChildItem $configDir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
            Write-Log "Config removed" "OK"
        }
        $procs = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
        if ($procs) { $procs | Stop-Process -Force }
        Write-Host "Tunnel uninstalled." -ForegroundColor Green
    }
}
