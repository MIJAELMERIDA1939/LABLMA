param(
    [switch]$Uninstall,
    [switch]$Status
)

$taskName = "SGC-Server"
$scriptPath = Join-Path $PSScriptRoot "start-server.ps1"

if ($Uninstall) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Task '$taskName' removed."
    return
}

if ($Status) {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($task) {
        Write-Host "Task '$taskName': $($task.State)"
    } else {
        Write-Host "Task '$taskName': NOT INSTALLED"
    }
    return
}

# Install
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -Priority 5
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Task '$taskName' installed!" -ForegroundColor Green
Write-Host "  Runs at Windows startup as SYSTEM" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  Start now:   Start-ScheduledTask -TaskName `"$taskName`""
Write-Host "  Stop now:    Stop-ScheduledTask -TaskName `"$taskName`""
Write-Host "  Uninstall:   .\install-service.ps1 -Uninstall"
Write-Host "  Status:      .\install-service.ps1 -Status"
