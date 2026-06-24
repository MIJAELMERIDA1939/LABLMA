$root = "C:\LABUGRAM\sgc"
$logFile = "$root\logs\tunnel.log"
$urlFile = "$root\logs\tunnel-url.txt"

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"$ts - Iniciando localtunnel..." | Add-Content $logFile -Encoding UTF8

$output = npx localtunnel --port 3000 2>&1
$url = ($output | Select-String "your url is:").ToString() -replace "your url is: ", ""
$url = $url.Trim()

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
if ($url) {
    "$ts - TUNNEL ACTIVO: $url" | Add-Content $logFile -Encoding UTF8
    $url | Set-Content $urlFile -Encoding UTF8
} else {
    "$ts - ERROR: $output" | Add-Content $logFile -Encoding UTF8
}
