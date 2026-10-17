<#
  sync-github.ps1 - Windows: holt fremde Änderungen, committet alles und schickt es nach GitHub (Zweig main).

  Die Seite https://igorssource.github.io/LibraryAtHome/ wird danach von GitHub Actions selbst neu veröffentlicht.
  Die Cloud-Sitzungen (Telefon) schreiben auf Zweige claude/..., ein Workflow übernimmt sie nach main;
  darum erst holen (pull --rebase), dann senden.

  Beispiel:  .\sync-github.ps1
             .\sync-github.ps1 -Message "Книги: +12"
#>
param([string]$Message)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
Push-Location $root
try {
  if (-not (Test-Path (Join-Path $root ".git"))) { throw "Im Projekt gibt es kein git-Repository." }
  git pull --rebase --autostash origin main
  git add -A
  $status = git status --porcelain
  if ($status) {
    if (-not $Message) {
      $data = [IO.File]::ReadAllText((Join-Path $root "home-library\books-data.js"), [Text.Encoding]::UTF8)
      $n = ([regex]::Matches($data, '(?m)^\s+id:\s*\d+,')).Count
      $Message = "Библиотека: $n книг"
    }
    git commit -q -m $Message
    Write-Host "commit: $Message"
  } else {
    Write-Host "keine Änderungen zum Veröffentlichen"
  }
  git push origin main
  Write-Host "gesendet. Seite: https://igorssource.github.io/LibraryAtHome/ (aktualisiert sich in 1-3 Minuten)"
} finally { Pop-Location }
