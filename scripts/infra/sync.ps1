param(
    [ValidateSet("push", "status", "log")]
    [string]$Action = "push"
)

$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
$LogDir = Join-Path $ProjectRoot "logs"

switch ($Action) {
    "push" {
        $msg = Read-Host "Commit message"
        if (-not $msg) { $msg = "sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }

        $result = & git -C $ProjectRoot add -A 2>&1
        $result = & git -C $ProjectRoot commit -m $msg 2>&1

        if ($LASTEXITCODE -eq 0) {
            Write-Host "Committed: $msg" -ForegroundColor Green
        } else {
            Write-Host "Nothing to commit or error: $result" -ForegroundColor Yellow
        }

        $pushResult = & git -C $ProjectRoot push 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Pushed to remote. Server will auto-deploy." -ForegroundColor Green
            $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            "[$time] PUSH: $msg" | Out-File -FilePath (Join-Path $LogDir "sync.log") -Append -Encoding UTF8
        } else {
            Write-Host "Push failed: $pushResult" -ForegroundColor Red
            Write-Host "Tip: You need to set up the remote first: git remote add origin <url>" -ForegroundColor Yellow
        }
    }

    "status" {
        $branch = & git -C $ProjectRoot rev-parse --abbrev-ref HEAD 2>$null
        $lastCommit = & git -C $ProjectRoot log -1 --format="%h %s (%ar)" 2>$null
        $status = & git -C $ProjectRoot status --short 2>$null
        $remoteUrl = & git -C $ProjectRoot remote get-url origin 2>$null

        Write-Host "========== SYNC STATUS ==========" -ForegroundColor Cyan
        Write-Host "Branch:      $branch"
        Write-Host "Remote:      $remoteUrl"
        Write-Host "Last commit: $lastCommit"
        Write-Host "Uncommitted: $(if ($status) { "`n$status" } else { "clean" })"
        Write-Host "=================================" -ForegroundColor Cyan
    }

    "log" {
        $syncLog = Join-Path $LogDir "sync.log"
        if (Test-Path $syncLog) {
            Write-Host "==== DEPLOY LOG ====" -ForegroundColor Cyan
            Get-Content $syncLog -Tail 20
        } else {
            Write-Host "No sync log yet."
        }
    }
}
