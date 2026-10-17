<#
  find-covers.ps1 - автоматический поиск обложек (и недостающих авторов) для книг из books-data.js

  Порядок источников выбирается по языку названия (см. references/cover-sources.md):
    кириллица : Labirint -> LiveLib -> Open Library -> Apple Books
    латиница  : Open Library -> Apple Books -> DNB (ISBN) -> Amazon по ISBN -> Google Books по ISBN
  Совпадение принимается только если название и автор сходятся (см. TitleScore/AuthorOk/NumsOk).

  Примеры:
    .\find-covers.ps1                      # все книги с пустой обложкой, только отчёт + review.html
    .\find-covers.ps1 -Ids 180,181 -Apply  # искать только эти id и записать найденное в books-data.js
    .\find-covers.ps1 -Apply -ApplyAuthors # дополнительно подставить подтверждённых авторов

  Результат: work\covers.tsv, work\review.html (сетка для визуальной проверки), work\books-data.backup.js
#>
param(
  [string]$BooksFile,
  [int[]]$Ids,
  [string]$Hints,
  [string]$OutDir,
  [switch]$Apply,
  [switch]$ApplyAuthors
)
$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$u = New-Object System.Text.UTF8Encoding($false)
$skillRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
if (-not $BooksFile) { $BooksFile = Join-Path $projectRoot "home-library\books-data.js" }
if (-not $OutDir) { $OutDir = Join-Path $skillRoot "work" }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

# ---------- известные «заглушки» Google Books (md5) ----------
$GooglePlaceholders = @{
  'D7C21C65FC861FC5128753E9E091B23C' = 1   # книга есть, картинки нет
  '1643561ACB0BE0021A1AF990DD7C1BD5' = 1   # несуществующий ISBN
  'E89E0E364E83C0ECFBA5DA41007C9A2C' = 1   # несуществующий ISBN (вариант)
}
$GoogleSeen = @{}
$script:MinScore = 0.6
$script:LiveLibBlocked = $false   # md5 -> набор ISBN: если один хэш у двух разных ISBN, это заглушка

# ---------- вспомогательные функции ----------
function Norm([string]$s) { $s = $s.ToLower() -replace 'ё','е'; return ([regex]::Replace($s, '[^\p{L}\p{N}]+', ' ')).Trim() }
function Words([string]$s) { (Norm $s) -split ' ' | Where-Object { $_.Length -ge 3 } }
function HasCyr([string]$s) { return [regex]::IsMatch($s, '\p{IsCyrillic}') }
function Surname([string]$a) { if (-not $a) { return '' }; return (($a -split '[ ,]+' | Where-Object { $_.Length -ge 3 }) | Select-Object -Last 1) }
function Fix-Moji([string]$s) {
  if ($s -match 'Ã|Â|Ð') { try { return [System.Text.Encoding]::UTF8.GetString([System.Text.Encoding]::GetEncoding(28591).GetBytes($s)) } catch { return $s } }
  return $s
}
# min(полнота, точность) по значимым словам; double-приведение обязательно (иначе Min округляет до int)
function TitleScore([string]$want, [string]$have) {
  $w = @(Words $want)
  if (-not $w.Count) {   # названия из коротких токенов («S.N.U.F.F.», «А»): сравниваем строки без пробелов
    $a = (Norm $want) -replace ' ', ''; $b = (Norm $have) -replace ' ', ''
    if ($a -and ($a -eq $b)) { return 1 } else { return 0 }
  }
  $hv = @(Words $have); if (-not $hv.Count) { return 0 }
  $hn = Norm $have; $wn = Norm $want
  $recall = [double]@($w | Where-Object { $hn.Contains($_) }).Count / [double]$w.Count
  $prec   = [double]@($hv | Where-Object { $wn.Contains($_) }).Count / [double]$hv.Count
  return [math]::Round([math]::Min($recall, $prec), 2)
}
function RecallScore([string]$want, [string]$have) {
  $w = @(Words $want); if (-not $w.Count) { return 0 }
  $hn = Norm $have
  return [math]::Round([double]@($w | Where-Object { $hn.Contains($_) }).Count / [double]$w.Count, 2)
}
function AuthorOk([string]$want, [string]$have) {
  $w = Words $want; if (-not $w) { return $true }
  $h = Norm $have
  foreach ($x in $w) { if ($h.Contains($x)) { return $true } }
  return $false
}
# номера томов/выпусков из искомого названия должны присутствовать у кандидата (иначе это другой том)
function NumsOk([string]$want, [string]$have) {
  $nums = [regex]::Matches((Norm $want), '(?<![\p{L}\p{N}])\d{1,3}(?![\p{L}\p{N}])') | ForEach-Object { $_.Value }
  $hn = Norm $have
  foreach ($n in $nums) { if ($hn -notmatch "(?<![\p{L}\p{N}])$n(?![\p{L}\p{N}])") { return $false } }
  return $true
}
function Get-Text([string]$uri) {
  for ($i = 0; $i -lt 3; $i++) {
    try {
      $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 30 -UserAgent $UA -Headers @{ "Accept-Language" = "ru-RU,ru;q=0.9,de;q=0.8,en;q=0.7" }
      return [System.Text.Encoding]::UTF8.GetString($r.RawContentStream.ToArray())
    } catch {
      if ("$_" -match '429') { Start-Sleep -Seconds 10 } else { Start-Sleep -Milliseconds 1200 }
    }
  }
  return $null
}
function Get-Json([string]$uri) {
  for ($i = 0; $i -lt 3; $i++) { try { return Invoke-RestMethod -Uri $uri -TimeoutSec 30 } catch { Start-Sleep -Milliseconds 1200 } }
  return $null
}
function Img-Bytes([string]$uri) {
  try {
    $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 5 -UserAgent $UA
    if ($r.Headers["Content-Type"] -notmatch 'image') { return $null }
    return $r.RawContentStream.ToArray()
  } catch { return $null }
}
function Md5([byte[]]$b) { return ([System.BitConverter]::ToString([System.Security.Cryptography.MD5]::Create().ComputeHash($b)) -replace '-', '') }
function Isbn10([string]$i13) {
  if ($i13 -notmatch '^978\d{10}$') { return $null }
  $d = $i13.Substring(3, 9); $s = 0
  for ($k = 0; $k -lt 9; $k++) { $s += [int]::Parse($d[$k].ToString()) * (10 - $k) }
  $c = (11 - ($s % 11)) % 11
  return $d + $(if ($c -eq 10) { 'X' } else { $c.ToString() })
}
function Clean-Author([string]$a) {
  $a = $a -replace '\[[^\]]*\]', ''
  if ($a -match '^\s*([^,]+),\s*(.+?)\s*$') { $a = "$($Matches[2]) $($Matches[1])" }   # "Kühl, Katharina" -> "Katharina Kühl"
  return ($a -replace '\s+', ' ').Trim()
}

# ---------- источники: каждый возвращает @{src;score;url;matched;author;isbns} или $null ----------
function Src-Labirint([string]$title, [string]$author, [bool]$authorKnown) {
  foreach ($q in (@("$(Surname $author) $title".Trim(), $title) | Select-Object -Unique)) {
    $html = Get-Text ("https://www.labirint.ru/search/" + [uri]::EscapeDataString($q) + "/?stype=0")
    Start-Sleep -Milliseconds 700
    if (-not $html) { continue }
    $cards = [regex]::Matches($html, '(?s)data-product-id="(\d+)"\s+data-name="([^"]*)".*?(?=data-product-id=|$)')
    foreach ($c in ($cards | Select-Object -First 24)) {
      $nm = [System.Net.WebUtility]::HtmlDecode($c.Groups[2].Value)
      $ts = TitleScore $title $nm
      if ($ts -lt $script:MinScore -or -not (NumsOk $title $nm)) { continue }
      if ($author -and -not (AuthorOk $author $c.Value)) { continue }
      if (-not $authorKnown -and $ts -lt 0.9) { continue }
      $au = ''; $m = [regex]::Match($c.Value, 'title="([^"]{3,60}?) - [^"]*"'); if ($m.Success) { $au = [System.Net.WebUtility]::HtmlDecode($m.Groups[1].Value) }
      foreach ($n in 1..4) {
        $url = "https://img$n.labirint.ru/books/$($c.Groups[1].Value)/cover.jpg"
        $b = Img-Bytes $url
        if ($b -and $b.Length -gt 8000) { return @{ src = 'labirint'; score = $ts; url = $url; matched = $nm; author = $au } }
      }
    }
  }
  return $null
}
function Src-LiveLib([string]$title, [string]$author, [bool]$authorKnown) {
  foreach ($q in (@("$title $(Surname $author)".Trim(), $title) | Select-Object -Unique)) {
    if ($script:LiveLibBlocked) { return $null }
    $html = Get-Text ("https://www.livelib.ru/find/books/" + [uri]::EscapeDataString($q))
    Start-Sleep -Milliseconds 1200
    # при частых запросах LiveLib отдаёт страницу-заглушку (около 8 КБ, без карточек): ждём и пробуем ещё раз, потом отключаем источник на этот запуск
    if ($html -and $html.Length -lt 20000 -and $html -notmatch 'object-wrapper') {
      Start-Sleep -Seconds 30
      $html = Get-Text ("https://www.livelib.ru/find/books/" + [uri]::EscapeDataString($q))
      if ($html -and $html.Length -lt 20000 -and $html -notmatch 'object-wrapper') { $script:LiveLibBlocked = $true; Write-Host "! LiveLib временно ограничил запросы: источник пропущен до конца запуска"; return $null }
    }
    if (-not $html) { continue }
    $cards = [regex]::Matches($html, '(?s)object-wrapper object-edition[^>]*data-link="([^"]+)">\s*<a href="[^"]*" title="([^"]*)">\s*<span class="object-cover" style="background:url\(([^)]+)\)')
    foreach ($c in ($cards | Select-Object -First 15)) {
      $full = [System.Net.WebUtility]::HtmlDecode($c.Groups[2].Value)   # "Автор - Название"
      $cov = $c.Groups[3].Value
      if ($cov -match '0000000000|nocover') { continue }
      $ct = $full; $ca = ''
      if ($full -match '^(.*?)\s+-\s+(.*)$') { $ca = $Matches[1]; $ct = $Matches[2] }
      $ts = TitleScore $title $ct
      if ($ts -lt $script:MinScore -or -not (NumsOk $title $ct)) { continue }
      if ($author -and -not (AuthorOk $author $ca)) { continue }
      if (-not $authorKnown -and $ts -lt 0.9) { continue }
      foreach ($variant in @(($cov -replace '/140x220/', '/200x305/'), $cov)) {
        $b = Img-Bytes $variant
        if ($b -and $b.Length -gt 4000) { return @{ src = 'livelib'; score = $ts; url = $variant; matched = "$ca - $ct"; author = $ca } }
      }
    }
  }
  return $null
}
function Src-OpenLibrary([string]$title, [string]$author, [bool]$authorKnown) {
  $urls = @(
    ("https://openlibrary.org/search.json?q=" + [uri]::EscapeDataString("$title $author".Trim()) + "&limit=8&fields=title,author_name,cover_i,isbn"),
    ("https://openlibrary.org/search.json?title=" + [uri]::EscapeDataString($title) + $(if ($author) { "&author=" + [uri]::EscapeDataString($author) } else { "" }) + "&limit=8&fields=title,author_name,cover_i,isbn")
  )
  $isbns = @(); $res = $null
  foreach ($url in $urls) {
    $j = Get-Json $url
    if (-not ($j -and $j.docs)) { continue }
    foreach ($d in $j.docs) {
      $dt = Fix-Moji $d.title
      $ts = TitleScore $title $dt
      if ($ts -lt $script:MinScore -or -not (NumsOk $title $dt)) { continue }
      $da = Fix-Moji (($d.author_name) -join ' ')
      if ($author -and -not (AuthorOk $author $da)) { continue }
      if (-not $authorKnown -and $ts -lt 0.9) { continue }
      if ($d.isbn) { $isbns += @($d.isbn | Where-Object { $_ -match '^97[89]\d{10}$' } | Select-Object -First 4) }
      if ($d.cover_i -and -not $res) { $res = @{ src = 'openlibrary'; score = $ts; url = "https://covers.openlibrary.org/b/id/$($d.cover_i)-L.jpg"; matched = $dt; author = (($d.author_name | Select-Object -First 1)) } }
    }
    if ($res) { break }
  }
  if ($res) { $res.isbns = $isbns; return $res }
  if ($isbns.Count) { return @{ src = 'openlibrary-isbn'; score = 0; url = ''; matched = ''; author = ''; isbns = $isbns } }
  return $null
}
function Src-Apple([string]$title, [string]$author, [bool]$authorKnown) {
  foreach ($cc in @('de', 'us')) {
    foreach ($term in (@("$title $author".Trim(), $title) | Select-Object -Unique)) {
      $j = Get-Json ("https://itunes.apple.com/search?term=" + [uri]::EscapeDataString($term) + "&media=ebook&limit=6&country=$cc")
      if (-not ($j -and $j.results)) { continue }
      foreach ($r in $j.results) {
        $ts = TitleScore $title $r.trackName
        if ($ts -lt ($script:MinScore + 0.1) -or -not (NumsOk $title $r.trackName)) { continue }
        if ($author -and -not (AuthorOk $author $r.artistName)) { continue }
        if (-not $authorKnown -and $ts -lt 0.9) { continue }
        if ($r.artworkUrl100) { return @{ src = "apple-$cc"; score = $ts; url = ($r.artworkUrl100 -replace '100x100bb', '600x600bb'); matched = "$($r.trackName) / $($r.artistName)"; author = $r.artistName } }
      }
    }
  }
  return $null
}
$script:LastDnb = [datetime]::MinValue
function Src-DnbIsbn([string]$title, [string]$author) {
  $wait = 1.5 - ([datetime]::Now - $script:LastDnb).TotalSeconds
  if ($wait -gt 0) { Start-Sleep -Milliseconds ([int]($wait * 1000)) }
  $script:LastDnb = [datetime]::Now
  # поиск по словам (AND): фраза целиком не находит названия с «–» и подзаголовками
  $toks = @((Norm $title) -split ' ' | Where-Object { $_.Length -ge 3 -or $_ -match '^\d+$' } | Select-Object -First 6)
  if (-not $toks.Count) { return $null }
  $cql = ($toks | ForEach-Object { 'tit="' + $_ + '"' }) -join ' and '
  $xml = Get-Text ("https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&maximumRecords=10&recordSchema=oai_dc&query=" + [uri]::EscapeDataString($cql))
  if (-not $xml) { return $null }
  $isbns = @(); $au = ''
  try {
    foreach ($rec in ([xml]$xml).GetElementsByTagName('record')) {
      $rt = ($rec.GetElementsByTagName('dc:title') | ForEach-Object { $_.InnerText }) -join ' '
      $ra = ($rec.GetElementsByTagName('dc:creator') | ForEach-Object { $_.InnerText }) -join ' '
      if ((RecallScore $title $rt) -lt 0.99 -or -not (NumsOk $title $rt)) { continue }
      if ($author -and -not (AuthorOk $author "$rt $ra")) { continue }
      if (-not $au) { $au = Clean-Author (($rec.GetElementsByTagName('dc:creator') | Select-Object -First 1).InnerText) }
      foreach ($id in $rec.GetElementsByTagName('dc:identifier')) {
        $m = [regex]::Match($id.InnerText, '97[89][\d-]{10,16}')
        if ($m.Success) { $d = $m.Value -replace '-', ''; if ($d.Length -eq 13) { $isbns += $d } }
      }
    }
  } catch {}
  if ($isbns.Count) { return @{ src = 'dnb-isbn'; score = 1; url = ''; matched = ''; author = $au; isbns = $isbns } }
  return $null
}
# ISBN -> обложка. Amazon первым (крупнее, без «заглушек»), Google вторым (с защитой от заглушек)
function Cover-ByIsbn([string[]]$isbns) {
  foreach ($i in ($isbns | Select-Object -Unique | Select-Object -First 6)) {
    $i = $i -replace '[^0-9X]', ''
    if ($i.Length -ne 13) { continue }
    $i10 = Isbn10 $i
    if ($i10) {
      $url = "https://m.media-amazon.com/images/P/$i10.01._SCLZZZZZZZ_.jpg"
      $b = Img-Bytes $url
      if ($b -and $b.Length -gt 3000) { return @{ src = 'amazon-isbn'; score = 1; url = $url; matched = "ISBN $i" } }   # у отсутствующих — гифка в 43 байта
    }
    $url = "https://books.google.com/books/content?vid=ISBN:$i&printsec=frontcover&img=1&zoom=1"
    $b = Img-Bytes $url
    if ($b -and $b.Length -gt 3000) {
      $h = Md5 $b
      if (-not $GoogleSeen.ContainsKey($h)) { $GoogleSeen[$h] = @{} }
      $GoogleSeen[$h][$i] = 1
      if (-not $GooglePlaceholders.ContainsKey($h) -and $GoogleSeen[$h].Count -lt 2) { return @{ src = 'google-isbn'; score = 1; url = $url; matched = "ISBN $i" } }
    }
  }
  return $null
}

# ---------- чтение списка книг и подсказок ----------
$text = [IO.File]::ReadAllText($BooksFile, $u)
$list = @()
$rx = [regex]'(?s)\{\s*id:\s*(\d+),\s*title:\s*"(.*?)",\s*author:\s*"(.*?)",\s*genre:\s*\[.*?\],\s*cover:\s*"(.*?)",'
foreach ($m in $rx.Matches($text)) { $list += [pscustomobject]@{ id = [int]$m.Groups[1].Value; title = $m.Groups[2].Value; author = $m.Groups[3].Value; cover = $m.Groups[4].Value } }
$hint = @{}
if ($Hints -and (Test-Path $Hints)) {
  foreach ($l in [IO.File]::ReadAllLines($Hints, $u)) {
    if (-not $l.Trim() -or $l.StartsWith('#')) { continue }
    $c = $l -split "`t"
    $hint[[int]$c[0]] = @{ query = $c[1]; author = $c[2]; isbn = $c[3]; minscore = $c[4] }
  }
}

# ---------- основной цикл ----------
$tsv = Join-Path $OutDir "covers.tsv"
"id`tstatus`tsource`tscore`turl`tmatched`tauthor_candidate`tauthor_confirmed`ttitle" | Out-File $tsv -Encoding utf8
$results = @()
foreach ($b in $list) {
  if ($Ids) { if ($Ids -notcontains $b.id) { continue } } elseif ($b.cover) { continue }

  $title = ($b.title -replace '\[[^\]]*\]', '' -replace '\s*\((книги.*?|tiptoi|EN)\)', '' -replace '^.*№\d+\s+—\s+', '' -replace '\s+', ' ').Trim()
  $author = $b.author
  $authorUnknown = $author -match 'не указан'
  $authorKnown = $true
  if ($author -match 'не указан|Сборник|Журнал|u\. a\.|серия|Langenscheidt|Ravensburger|^DK$|NGV|dtv|Zeit Weltkunst|Hueber|Klett|Verlag') { $author = ''; $authorKnown = $false }
  $isbnHint = ''; $script:MinScore = 0.6
$script:LiveLibBlocked = $false
  if ($hint.ContainsKey($b.id)) {
    $h = $hint[$b.id]
    if ($h.query) { $title = $h.query }
    if ($h.author -eq '-') { $author = ''; $authorKnown = $false } elseif ($h.author) { $author = $h.author; $authorKnown = $true }
    $isbnHint = $h.isbn
    if ($h.minscore) { $script:MinScore = [double]::Parse($h.minscore, [Globalization.CultureInfo]::InvariantCulture) }
  }
  if ($b.title -match '\[уточнить' -and @(Words $title).Count -lt 2 -and -not $isbnHint) {
    $results += [pscustomobject]@{ id = $b.id; status = 'SKIP'; src = ''; score = 0; url = ''; matched = ''; acand = ''; aconf = ''; title = $b.title }
    continue
  }

  $found = $null; $authors = @(); $isbns = @()
  if ($isbnHint) { $found = Cover-ByIsbn @($isbnHint) }

  $order = if ((HasCyr $title) -or (HasCyr $author)) { @('labirint', 'livelib', 'openlibrary', 'apple') } else { @('openlibrary', 'apple') }
  foreach ($step in $order) {
    if ($found -and -not $authorUnknown) { break }
    $r = switch ($step) {
      'labirint'    { Src-Labirint $title $author $authorKnown }
      'livelib'     { Src-LiveLib $title $author $authorKnown }
      'openlibrary' { Src-OpenLibrary $title $author $authorKnown }
      'apple'       { Src-Apple $title $author $authorKnown }
    }
    if (-not $r) { continue }
    if ($r.author) { $authors += $r.author }
    if ($r.isbns) { $isbns += $r.isbns }
    if (-not $found -and $r.url) { $found = $r }
  }
  if (-not (HasCyr $title) -and -not (HasCyr $author) -and ((-not $found) -or $authorUnknown)) {
    $d = Src-DnbIsbn $title $author
    if ($d) {
      if ($d.author) { $authors += $d.author }
      if ($authorKnown) { $isbns += $d.isbns; if (-not $found) { $found = Cover-ByIsbn $isbns } }
    }
  }
  if (-not $found -and $isbns.Count) { $found = Cover-ByIsbn $isbns }

  # автор не указан на корешке: сравниваем кандидатов из независимых источников
  #   yes      - фамилия совпала минимум у двух источников (автор подтверждён)
  #   conflict - источники назвали разных авторов (в базе несколько книг с таким названием)
  #   no       - кандидат один или нет вовсе
  $acand = ''; $aconf = ''
  if ($authorUnknown -and $authors.Count) {
    $acand = $authors[0]
    $sns = @($authors | ForEach-Object { Norm (Surname $_) } | Where-Object { $_ } | Select-Object -Unique)
    $agree = @($authors | Where-Object { (Norm $_).Contains((Norm (Surname $acand))) }).Count
    $aconf = if ($agree -ge 2 -and @(Words $title).Count -ge 2) { 'yes' } elseif ($sns.Count -ge 2 -and $agree -lt 2) { 'conflict' } else { 'no' }
  }
  # без подтверждённого автора обложку принимаем только если название достаточно специфичное (3+ значимых слов) и нет конфликта
  $unsure = (-not $authorKnown) -and $found -and ($aconf -eq 'conflict' -or ($aconf -ne 'yes' -and @(Words $title).Count -lt 3))

  if ($found -and $unsure) {
    $results += [pscustomobject]@{ id = $b.id; status = 'UNSURE'; src = $found.src; score = $found.score; url = $found.url; matched = $found.matched; acand = $acand; aconf = $aconf; title = $b.title }
  } elseif ($found) {
    $results += [pscustomobject]@{ id = $b.id; status = 'FOUND'; src = $found.src; score = $found.score; url = $found.url; matched = $found.matched; acand = $acand; aconf = $aconf; title = $b.title }
  } else {
    $results += [pscustomobject]@{ id = $b.id; status = 'NONE'; src = ''; score = 0; url = ''; matched = ''; acand = $acand; aconf = $aconf; title = $b.title }
  }
  $last = $results[-1]
  "$($last.id)`t$($last.status)`t$($last.src)`t$($last.score)`t$($last.url)`t$($last.matched)`t$($last.acand)`t$($last.aconf)`t$($last.title)" | Out-File $tsv -Append -Encoding utf8
  Write-Host ("{0,4}  {1,-5} {2,-12} {3}" -f $last.id, $last.status, $last.src, $b.title)
}

# ---------- страница для визуальной проверки ----------
$h = "<!doctype html><meta charset=utf-8><style>body{font:12px sans-serif;margin:8px;background:#fff}.g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.c{border:1px solid #ccc;padding:4px;text-align:center}img{width:100%;height:170px;object-fit:contain}</style><div class=g>"
foreach ($r in ($results | Where-Object { $_.status -in 'FOUND', 'UNSURE' })) {
  $t = [System.Net.WebUtility]::HtmlEncode($r.title); $m = [System.Net.WebUtility]::HtmlEncode($r.matched); $a = [System.Net.WebUtility]::HtmlEncode($r.acand)
  $style = if ($r.status -eq 'UNSURE') { " style=`"border:2px solid #d63031`"" } else { "" }
  $extra = if ($r.status -eq 'UNSURE') { "<br><b style=`"color:#d63031`">НЕ ПРИМЕНЕНО: автор неясен ($a)</b>" } elseif ($a) { "<br>автор: $a [$($r.aconf)]" } else { "" }
  $h += "<div class=c$style><img src=`"$($r.url)`"><b>$($r.id)</b> [$($r.src) $($r.score)]<br>$t<br><i>$m</i>$extra</div>"
}
$h += "</div>"
[IO.File]::WriteAllText((Join-Path $OutDir "review.html"), $h, $u)

# ---------- запись в books-data.js ----------
if ($Apply -or $ApplyAuthors) {
  Copy-Item $BooksFile (Join-Path $OutDir "books-data.backup.js") -Force
  $coverMap = @{}; $authorMap = @{}
  foreach ($r in $results) {
    if ($Apply -and $r.status -eq 'FOUND' -and $r.url) { $coverMap[$r.id] = $r.url }
    if ($ApplyAuthors -and $r.aconf -eq 'yes' -and $r.acand) { $authorMap[$r.id] = $r.acand }
  }
  $nl = if ($text.Contains("`r`n")) { "`r`n" } else { "`n" }
  $out = New-Object System.Collections.Generic.List[string]
  $cur = $null; $nc = 0; $na = 0
  foreach ($line in ($text -split "\r?\n")) {
    if ($line -match '^\s+id:\s*(\d+),\s*$') { $cur = [int]$Matches[1] }
    if ($cur -ne $null) {
      if ($coverMap.ContainsKey($cur) -and $line -match '^\s+cover:\s*"",\s*$') { $line = '    cover: "' + $coverMap[$cur] + '",'; $nc++ }
      elseif ($authorMap.ContainsKey($cur) -and $line -match '^\s+author:\s*".*не указан.*",\s*$') { $line = '    author: "' + ($authorMap[$cur] -replace '"', '') + '",'; $na++ }
    }
    $out.Add($line)
  }
  [IO.File]::WriteAllText($BooksFile, ($out -join $nl), $u)
  Write-Host "записано обложек: $nc, авторов: $na"
}
$f = @($results | Where-Object { $_.status -eq 'FOUND' }).Count
$n = @($results | Where-Object { $_.status -eq 'NONE' }).Count
$s = @($results | Where-Object { $_.status -eq 'SKIP' }).Count
$us = @($results | Where-Object { $_.status -eq 'UNSURE' }).Count
Write-Host "итого: найдено $f, неуверенно (не применено) $us, не найдено $n, пропущено $s."
Write-Host "отчёт: $tsv ; страница для проверки: $(Join-Path $OutDir 'review.html')"
