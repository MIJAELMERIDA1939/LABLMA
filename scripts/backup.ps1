param(
    [int]$RetentionDays = 30,
    [string]$ProjectRoot = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$DataDir = Join-Path $ProjectRoot "data"
$BackupDir = Join-Path $ProjectRoot "backup"
$LogDir = Join-Path $ProjectRoot "logs"
$Date = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFile = Join-Path $BackupDir "sgc-backup-$Date.zip"

if (-not (Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null }

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Creating backup..."

try {
    Compress-Archive -Path "$DataDir\*" -DestinationPath $BackupFile -CompressionLevel Optimal
    $size = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)
    Write-Host "  Created: $BackupFile ($size MB)"
} catch {
    Write-Host "  ERROR: $_" -ForegroundColor Red
    exit 1
}

# Clean old backups
$removed = 0
$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem $BackupDir -Filter "sgc-backup-*.zip" | Where-Object {
    $_.LastWriteTime -lt $cutoff
} | ForEach-Object {
    Remove-Item $_.FullName -Force
    $removed++
}

if ($removed -gt 0) {
    Write-Host "  Cleaned $removed old backup(s) (retention: $RetentionDays days)"
}

Write-Host "Backup complete."
