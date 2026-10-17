<#
  add-entries.ps1 - добавляет новые книги в home-library\books-data.js

  Входной файл (UTF-8), по строке на книгу:   название|автор|жанр1;жанр2|описание
    - строка, начинающаяся с #, — заголовок секции (попадёт в файл комментарием)
    - жанры только из GENRES; неизвестный жанр отбрасывается и попадает в отчёт
    - пустые жанры допустимы:  название|автор||описание
  Дубликаты (то же название и тот же автор, с учётом номеров томов) пропускаются и попадают в отчёт.

  Пример:  .\add-entries.ps1 -InputFile ..\work\new-books.txt
#>
param(
  [Parameter(Mandatory = $true)][string]$InputFile,
  [string]$BooksFile,
  [switch]$DryRun
)
$u = New-Object System.Text.UTF8Encoding($false)
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
if (-not $BooksFile) { $BooksFile = Join-Path $projectRoot "home-library\books-data.js" }

function Norm([string]$s) { $s = $s.ToLower() -replace 'ё','е'; return ([regex]::Replace($s, '[^\p{L}\p{N}]+', ' ')).Trim() }
function Words([string]$s) { (Norm $s) -split ' ' | Where-Object { $_.Length -ge 3 } }
function TitleScore([string]$want, [string]$have) {
  $w = @(Words $want); if (-not $w.Count) { return 0 }
  $hv = @(Words $have); if (-not $hv.Count) { return 0 }
  $hn = Norm $have; $wn = Norm $want
  $recall = [double]@($w | Where-Object { $hn.Contains($_) }).Count / [double]$w.Count
  $prec   = [double]@($hv | Where-Object { $wn.Contains($_) }).Count / [double]$hv.Count
  return [math]::Min($recall, $prec)
}
function NumsOk([string]$want, [string]$have) {
  $nums = [regex]::Matches((Norm $want), '(?<![\p{L}\p{N}])\d{1,3}(?![\p{L}\p{N}])') | ForEach-Object { $_.Value }
  $hn = Norm $have
  foreach ($n in $nums) { if ($hn -notmatch "(?<![\p{L}\p{N}])$n(?![\p{L}\p{N}])") { return $false } }
  return $true
}
function AuthorUnknown([string]$a) { return (-not $a.Trim()) -or ($a -match 'не указан|Сборник|Журнал|u\. a\.|серия') }
function AuthorsOverlap([string]$a, [string]$b) {
  if ((AuthorUnknown $a) -or (AuthorUnknown $b)) { return $true }
  $hb = Norm $b
  foreach ($w in (Words $a)) { if ($hb.Contains($w)) { return $true } }
  return $false
}
function SameBook([string]$t1, [string]$a1, [string]$t2, [string]$a2) {
  return ((TitleScore $t1 $t2) -ge 0.9) -and (NumsOk $t1 $t2) -and (NumsOk $t2 $t1) -and (AuthorsOverlap $a1 $a2)
}

$text = [IO.File]::ReadAllText($BooksFile, $u)
$nl = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
$gBlock = [regex]::Match($text, 'const GENRES = \[(.*?)\];', 'Singleline').Groups[1].Value
$allowed = [regex]::Matches($gBlock, '"([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
$existing = @()
foreach ($m in [regex]::Matches($text, '(?s)id:\s*(\d+),\s*title:\s*"(.*?)",\s*author:\s*"(.*?)"')) { $existing += [pscustomobject]@{ id = [int]$m.Groups[1].Value; title = $m.Groups[2].Value; author = $m.Groups[3].Value } }
$lastId = ($existing | Measure-Object -Property id -Maximum).Maximum
$palette = "#6c5ce7","#0984e3","#00b894","#e17055","#fdcb6e","#d63031","#2d3436","#636e72","#e84393","#00cec9","#a29bfe","#74b9ff","#fab1a0","#fd79a8"

$id = $lastId; $added = @(); $skipped = @(); $warn = @(); $blocks = New-Object System.Collections.Generic.List[string]
$pendingComment = $null; $batch = @()
foreach ($line in [IO.File]::ReadAllLines($InputFile, $u)) {
  if ([string]::IsNullOrWhiteSpace($line)) { continue }
  if ($line.StartsWith('#')) { $pendingComment = "  // ==== " + $line.Substring(1).Trim() + " ===="; continue }
  $f = $line.Split('|')
  if ($f.Count -ne 4) { $warn += "неверный формат (нужно 4 поля через |): $line"; continue }
  $title = $f[0].Trim(); $author = $f[1].Trim(); $genreStr = $f[2].Trim(); $desc = $f[3].Trim()
  if ("$title$author$desc" -match '["\\]') { $warn += "кавычки или обратный слэш в полях, пропущено: $title"; continue }

  $dup = $null
  foreach ($e in ($existing + $batch)) { if (SameBook $title $author $e.title $e.author) { $dup = $e; break } }
  if ($dup) { $skipped += "дубликат: «$title» = id $($dup.id) «$($dup.title)»"; continue }

  $gl = @()
  if ($genreStr) {
    foreach ($g in $genreStr.Split(';')) {
      $g = $g.Trim()
      if ($allowed -contains $g) { $gl += $g } elseif ($g) { $warn += "неизвестный жанр «$g» у «$title» — отброшен (предложить расширить GENRES в отчёте)" }
    }
  }
  $id++
  $batch += [pscustomobject]@{ id = $id; title = $title; author = $author }
  $color = $palette[($id) % $palette.Count]
  $gjs = ($gl | ForEach-Object { '"' + $_ + '"' }) -join ", "
  if ($pendingComment) { $blocks.Add($nl + $pendingComment); $pendingComment = $null }
  $blocks.Add((@(
    "  {",
    "    id: $id,",
    "    title: `"$title`",",
    "    author: `"$author`",",
    "    genre: [$gjs],",
    "    cover: `"`",",
    "    color: `"$color`",",
    "    description: `"$desc`"",
    "  }"
  ) -join $nl))
  $added += "id $id «$title»"
}

if ($added.Count -and -not $DryRun) {
  # склеиваем блоки запятыми; комментарии секций не получают запятую
  $sb = New-Object System.Text.StringBuilder
  $lastIsEntry = $false
  foreach ($b in $blocks) {
    if ($b.TrimStart().StartsWith('//')) { [void]$sb.Append($b + $nl); continue }
    [void]$sb.Append($b + "," + $nl)
  }
  $newText = $sb.ToString().TrimEnd().TrimEnd(',')
  $marker = $nl + "  }" + $nl + "];"
  $idx = $text.LastIndexOf($marker)
  if ($idx -lt 0) { throw "Не найден конец массива BOOKS в $BooksFile" }
  $result = $text.Substring(0, $idx) + $nl + "  }," + $nl + $newText + $nl + "];" + $text.Substring($idx + $marker.Length)
  [IO.File]::WriteAllText($BooksFile, $result, $u)
}
Write-Host ("добавлено: {0}{1}" -f $added.Count, $(if ($DryRun) { ' (пробный запуск, файл не изменён)' } else { '' }))
$added | ForEach-Object { Write-Host "  + $_" }
if ($skipped.Count) { Write-Host "пропущено дубликатов: $($skipped.Count)"; $skipped | ForEach-Object { Write-Host "  = $_" } }
if ($warn.Count) { Write-Host "предупреждения:"; $warn | ForEach-Object { Write-Host "  ! $_" } }
