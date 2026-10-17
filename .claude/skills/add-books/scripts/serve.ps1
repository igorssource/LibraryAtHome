param(
  [string]$Root = (Join-Path $PSScriptRoot "..\..\..\..\home-library"),
  [int]$Port = 8792,
  [switch]$Cors
)
# Минимальный статический сервер для проверки страницы в окне браузера (file:// там не исполняет JS)
$Root = (Resolve-Path $Root).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
while ($true) {
    $context = $listener.GetContext()
    if ($Cors) { $context.Response.Headers.Add("Access-Control-Allow-Origin", "*"); $context.Response.Headers.Add("Access-Control-Allow-Private-Network", "true"); $context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS"); if ($context.Request.HttpMethod -eq "OPTIONS") { $context.Response.StatusCode = 204; $context.Response.OutputStream.Close(); continue } }
    $path = $context.Request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $Root ($path.TrimStart('/'))
    if (Test-Path $file -PathType Leaf) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ct = switch ([System.IO.Path]::GetExtension($file)) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css" }
            ".js"   { "application/javascript; charset=utf-8" }
            default { "application/octet-stream" }
        }
        $context.Response.ContentType = $ct
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $context.Response.StatusCode = 404
    }
    $context.Response.OutputStream.Close()
}
