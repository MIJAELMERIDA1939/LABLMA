Write-Host "Stopping SGC services..."

$stopped = $false

Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "uvicorn"
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "  Stopped backend (PID $($_.ProcessId))"
    $stopped = $true
}

Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "next"
} | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "  Stopped frontend (PID $($_.ProcessId))"
    $stopped = $true
}

if (-not $stopped) {
    Write-Host "  No SGC services running."
} else {
    Write-Host "Done."
}
