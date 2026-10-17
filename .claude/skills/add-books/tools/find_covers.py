#!/usr/bin/env python3
"""find_covers.py - automatische Suche nach Covern (und fehlenden Autoren) für Bücher in books-data.js.

Python-Version von scripts/find-covers.ps1 (für Cloud-Sitzungen unter Linux; nur Standardbibliothek).
ACHTUNG: aus dem PowerShell-Skript übertragen und lokal noch nicht ausgeführt; beim ersten Lauf in der
Cloud auf Fehler achten und sie beheben.

Reihenfolge der Quellen (Begründung: references/cover-sources.md):
  Kyrillisch (Titel oder Autor): Labirint -> LiveLib -> Open Library -> Apple Books
  sonst:                         Open Library -> Apple Books -> DNB (ISBN) -> Amazon per ISBN -> Google Books per ISBN
Ein Treffer gilt nur, wenn Titel und Autor zusammenpassen.

Beispiele:
  python3 find_covers.py                        # alle Bücher mit leerem Cover, nur Bericht
  python3 find_covers.py --ids 180 181 --apply  # nur diese ids suchen und Treffer in books-data.js schreiben
  python3 find_covers.py --apply --apply-authors --download-review

Ergebnis: work/covers.tsv, work/review.html, work/books-data.backup.js, mit --download-review work/review/<id>.jpg
"""
import argparse
import hashlib
import html as htmllib
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)                                   # .claude/skills/add-books
ROOT = os.path.abspath(os.path.join(SKILL, "..", "..", ".."))  # Projektwurzel
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0 Safari/537.36")

# bekannte „Bild nicht verfügbar“-Platzhalter von Google Books (md5)
GOOGLE_PLACEHOLDERS = {
    "D7C21C65FC861FC5128753E9E091B23C",  # Buch existiert, Bild fehlt
    "1643561ACB0BE0021A1AF990DD7C1BD5",  # nicht existierende ISBN
    "E89E0E364E83C0ECFBA5DA41007C9A2C",  # nicht existierende ISBN (Variante)
}
google_seen = {}   # md5 -> Menge von ISBN; gleicher Hash bei zwei ISBN = Platzhalter
state = {"min_score": 0.6, "livelib_blocked": False, "last_dnb": 0.0}


# ---------- Hilfsfunktionen ----------
def norm(s):
    s = s.lower().replace("ё", "е")
    return re.sub(r"[\W_]+", " ", s).strip()


def words(s):
    return [w for w in norm(s).split() if len(w) >= 3]


def has_cyr(s):
    return re.search(r"[Ѐ-ӿ]", s or "") is not None


def surname(a):
    ws = [w for w in re.split(r"[ ,]+", a or "") if len(w) >= 3]
    return ws[-1] if ws else ""


def title_score(want, have):
    """min(Vollständigkeit, Genauigkeit) über die wesentlichen Wörter."""
    w = words(want)
    if not w:   # Titel aus kurzen Tokens («S.N.U.F.F.», «А»): Strings ohne Leerzeichen vergleichen
        a, b = norm(want).replace(" ", ""), norm(have).replace(" ", "")
        return 1.0 if a and a == b else 0.0
    hv = words(have)
    if not hv:
        return 0.0
    hn, wn = norm(have), norm(want)
    recall = sum(1 for x in w if x in hn) / len(w)
    prec = sum(1 for x in hv if x in wn) / len(hv)
    return round(min(recall, prec), 2)


def recall_score(want, have):
    w = words(want)
    if not w:
        return 0.0
    hn = norm(have)
    return round(sum(1 for x in w if x in hn) / len(w), 2)


def author_ok(want, have):
    w = words(want)
    if not w:
        return True
    h = norm(have)
    return any(x in h for x in w)


def nums_ok(want, have):
    """Bandnummern aus dem gesuchten Titel müssen beim Kandidaten vorkommen (sonst anderer Band)."""
    hn = norm(have)
    for n in re.findall(r"(?<!\w)\d{1,3}(?!\w)", norm(want)):
        if not re.search(r"(?<!\w)%s(?!\w)" % n, hn):
            return False
    return True


def md5(b):
    return hashlib.md5(b).hexdigest().upper()


def isbn10(i13):
    if not re.fullmatch(r"978\d{10}", i13):
        return None
    d = i13[3:12]
    s = sum(int(ch) * (10 - k) for k, ch in enumerate(d))
    c = (11 - (s % 11)) % 11
    return d + ("X" if c == 10 else str(c))


def clean_author(a):
    a = re.sub(r"\[[^\]]*\]", "", a or "")
    m = re.match(r"^\s*([^,]+),\s*(.+?)\s*$", a)
    if m:
        a = "%s %s" % (m.group(2), m.group(1))   # «Kühl, Katharina» -> «Katharina Kühl»
    return re.sub(r"\s+", " ", a).strip()


def http_get(url, timeout=30, retries=3):
    """-> (bytes | None, content_type)"""
    for _ in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Accept-Language": "ru-RU,ru;q=0.9,de;q=0.8,en;q=0.7"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read(), r.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(10)
            elif e.code in (401, 403, 404, 410):
                return None, ""
            else:
                time.sleep(1.2)
        except Exception:
            time.sleep(1.2)
    return None, ""


def get_text(url):
    data, _ = http_get(url)
    return data.decode("utf-8", "replace") if data else None


def get_json(url):
    data, _ = http_get(url)
    if not data:
        return None
    try:
        return json.loads(data.decode("utf-8", "replace"))
    except ValueError:
        return None


def img_bytes(url):
    data, ctype = http_get(url)
    if data and ctype.lower().startswith("image"):
        return data
    return None


def dedupe(seq):
    out = []
    for x in seq:
        if x not in out:
            out.append(x)
    return out


def q(s):
    return urllib.parse.quote(s, safe="")


# ---------- Quellen: jede liefert dict(src, score, url, matched, author, isbns) oder None ----------
def src_labirint(title, author, author_known):
    for query in dedupe([("%s %s" % (surname(author), title)).strip(), title]):
        page = get_text("https://www.labirint.ru/search/" + q(query) + "/?stype=0")
        time.sleep(0.7)
        if not page:
            continue
        starts = [(m.start(), m.group(1), m.group(2))
                  for m in re.finditer(r'data-product-id="(\d+)"\s+data-name="([^"]*)"', page)]
        for i, (pos, pid, name) in enumerate(starts[:24]):
            end = starts[i + 1][0] if i + 1 < len(starts) else len(page)
            seg = page[pos:end]
            nm = htmllib.unescape(name)
            ts = title_score(title, nm)
            if ts < state["min_score"] or not nums_ok(title, nm):
                continue
            if author and not author_ok(author, seg):
                continue
            if not author_known and ts < 0.9:
                continue
            au = ""
            m = re.search(r'title="([^"]{3,60}?) - [^"]*"', seg)
            if m:
                au = htmllib.unescape(m.group(1))
            for n in range(1, 5):
                url = "https://img%d.labirint.ru/books/%s/cover.jpg" % (n, pid)
                b = img_bytes(url)
                if b and len(b) > 8000:
                    return {"src": "labirint", "score": ts, "url": url, "matched": nm, "author": au}
    return None


def src_livelib(title, author, author_known):
    if state["livelib_blocked"]:
        return None
    for query in dedupe([("%s %s" % (title, surname(author))).strip(), title]):
        page = get_text("https://www.livelib.ru/find/books/" + q(query))
        time.sleep(1.2)
        # bei zu vielen Anfragen liefert LiveLib eine kleine Sperrseite ohne Karten: warten, dann Quelle abschalten
        if page is not None and len(page) < 20000 and "object-wrapper" not in page:
            time.sleep(30)
            page = get_text("https://www.livelib.ru/find/books/" + q(query))
            if page is not None and len(page) < 20000 and "object-wrapper" not in page:
                state["livelib_blocked"] = True
                print("! LiveLib hat Anfragen vorübergehend begrenzt: Quelle bis zum Ende dieses Laufs übersprungen")
                return None
        if not page:
            continue
        cards = re.finditer(
            r'object-wrapper object-edition[^>]*data-link="([^"]+)">\s*<a href="[^"]*" title="([^"]*)">'
            r'\s*<span class="object-cover" style="background:url\(([^)]+)\)', page, re.S)
        for idx, m in enumerate(cards):
            if idx >= 15:
                break
            full = htmllib.unescape(m.group(2))          # «Autor - Titel»
            cov = m.group(3)
            if "0000000000" in cov or "nocover" in cov:
                continue
            ct, ca = full, ""
            mm = re.match(r"^(.*?)\s+-\s+(.*)$", full)
            if mm:
                ca, ct = mm.group(1), mm.group(2)
            ts = title_score(title, ct)
            if ts < state["min_score"] or not nums_ok(title, ct):
                continue
            if author and not author_ok(author, ca):
                continue
            if not author_known and ts < 0.9:
                continue
            for variant in (cov.replace("/140x220/", "/200x305/"), cov):
                b = img_bytes(variant)
                if b and len(b) > 4000:
                    return {"src": "livelib", "score": ts, "url": variant, "matched": "%s - %s" % (ca, ct), "author": ca}
    return None


def src_openlibrary(title, author, author_known):
    fields = "&limit=8&fields=title,author_name,cover_i,isbn"
    urls = ["https://openlibrary.org/search.json?q=" + q(("%s %s" % (title, author)).strip()) + fields,
            "https://openlibrary.org/search.json?title=" + q(title)
            + (("&author=" + q(author)) if author else "") + fields]
    isbns, res = [], None
    for url in urls:
        j = get_json(url)
        if not (j and j.get("docs")):
            continue
        for d in j["docs"]:
            dt = d.get("title", "")
            ts = title_score(title, dt)
            if ts < state["min_score"] or not nums_ok(title, dt):
                continue
            da = " ".join(d.get("author_name") or [])
            if author and not author_ok(author, da):
                continue
            if not author_known and ts < 0.9:
                continue
            isbns += [x for x in (d.get("isbn") or []) if re.fullmatch(r"97[89]\d{10}", x)][:4]
            if d.get("cover_i") and not res:
                res = {"src": "openlibrary", "score": ts,
                       "url": "https://covers.openlibrary.org/b/id/%s-L.jpg" % d["cover_i"],
                       "matched": dt, "author": (d.get("author_name") or [""])[0]}
        if res:
            break
    if res:
        res["isbns"] = isbns
        return res
    if isbns:
        return {"src": "openlibrary-isbn", "score": 0, "url": "", "matched": "", "author": "", "isbns": isbns}
    return None


def src_apple(title, author, author_known):
    for cc in ("de", "us"):
        for term in dedupe([("%s %s" % (title, author)).strip(), title]):
            j = get_json("https://itunes.apple.com/search?term=" + q(term)
                         + "&media=ebook&limit=6&country=" + cc)
            if not (j and j.get("results")):
                continue
            for r in j["results"]:
                name = r.get("trackName", "")
                ts = title_score(title, name)
                if ts < state["min_score"] + 0.1 or not nums_ok(title, name):
                    continue
                if author and not author_ok(author, r.get("artistName", "")):
                    continue
                if not author_known and ts < 0.9:
                    continue
                if r.get("artworkUrl100"):
                    return {"src": "apple-" + cc, "score": ts,
                            "url": r["artworkUrl100"].replace("100x100bb", "600x600bb"),
                            "matched": "%s / %s" % (name, r.get("artistName", "")),
                            "author": r.get("artistName", "")}
    return None


def src_dnb_isbn(title, author):
    wait = 1.5 - (time.time() - state["last_dnb"])
    if wait > 0:
        time.sleep(wait)
    state["last_dnb"] = time.time()
    toks = [t for t in norm(title).split() if len(t) >= 3 or t.isdigit()][:6]
    if not toks:
        return None
    cql = " and ".join('tit="%s"' % t for t in toks)
    data, _ = http_get("https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve"
                       "&maximumRecords=10&recordSchema=oai_dc&query=" + q(cql))
    if not data:
        return None
    ns_srw = "{http://www.loc.gov/zing/srw/}"
    ns_dc = "{http://purl.org/dc/elements/1.1/}"
    isbns, au = [], ""
    try:
        root = ET.fromstring(data)
        for rec in root.iter(ns_srw + "record"):
            rt = " ".join((e.text or "") for e in rec.iter(ns_dc + "title"))
            creators = [(e.text or "") for e in rec.iter(ns_dc + "creator")]
            ra = " ".join(creators)
            if recall_score(title, rt) < 0.99 or not nums_ok(title, rt):
                continue
            if author and not author_ok(author, rt + " " + ra):
                continue
            if not au and creators:
                au = clean_author(creators[0])
            for e in rec.iter(ns_dc + "identifier"):
                m = re.search(r"97[89][\d-]{10,16}", e.text or "")
                if m:
                    d = m.group(0).replace("-", "")
                    if len(d) == 13:
                        isbns.append(d)
    except ET.ParseError:
        return None
    if isbns:
        return {"src": "dnb-isbn", "score": 1, "url": "", "matched": "", "author": au, "isbns": isbns}
    return None


def cover_by_isbn(isbns):
    """ISBN -> Cover: Amazon zuerst (größer, keine Platzhalter), Google Books danach (mit Platzhalter-Schutz)."""
    for i in dedupe(isbns)[:6]:
        i = re.sub(r"[^0-9X]", "", i)
        if len(i) != 13:
            continue
        i10 = isbn10(i)
        if i10:
            url = "https://m.media-amazon.com/images/P/%s.01._SCLZZZZZZZ_.jpg" % i10
            b = img_bytes(url)
            if b and len(b) > 3000:       # bei fehlendem Bild liefert Amazon ein GIF mit 43 Byte
                return {"src": "amazon-isbn", "score": 1, "url": url, "matched": "ISBN " + i}
        url = "https://books.google.com/books/content?vid=ISBN:%s&printsec=frontcover&img=1&zoom=1" % i
        b = img_bytes(url)
        if b and len(b) > 3000:
            h = md5(b)
            google_seen.setdefault(h, set()).add(i)
            if h not in GOOGLE_PLACEHOLDERS and len(google_seen[h]) < 2:
                return {"src": "google-isbn", "score": 1, "url": url, "matched": "ISBN " + i}
    return None


# ---------- Hauptprogramm ----------
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--books-file")
    ap.add_argument("--ids", type=int, nargs="*")
    ap.add_argument("--hints", help="TSV: id<TAB>query<TAB>author oder -<TAB>isbn<TAB>minscore")
    ap.add_argument("--out-dir")
    ap.add_argument("--apply", action="store_true", help="gefundene Cover in books-data.js schreiben")
    ap.add_argument("--apply-authors", action="store_true", help="bestätigte Autoren eintragen")
    ap.add_argument("--download-review", action="store_true",
                    help="Kandidaten-Cover nach work/review/<id>.jpg laden (zum Ansehen ohne Browser)")
    args = ap.parse_args()

    books_file = args.books_file or os.path.join(ROOT, "home-library", "books-data.js")
    out_dir = args.out_dir or os.path.join(SKILL, "work")
    os.makedirs(out_dir, exist_ok=True)

    with open(books_file, encoding="utf-8", newline="") as f:
        text = f.read()
    books = [{"id": int(m.group(1)), "title": m.group(2), "author": m.group(3), "cover": m.group(4)}
             for m in re.finditer(r'\{\s*id:\s*(\d+),\s*title:\s*"(.*?)",\s*author:\s*"(.*?)",\s*genre:\s*\[.*?\],'
                                  r'\s*cover:\s*"(.*?)",', text, re.S)]

    hints = {}
    if args.hints and os.path.exists(args.hints):
        with open(args.hints, encoding="utf-8") as f:
            for line in f.read().splitlines():
                if not line.strip() or line.startswith("#"):
                    continue
                c = line.split("\t") + [""] * 5
                hints[int(c[0])] = {"query": c[1], "author": c[2], "isbn": c[3], "minscore": c[4]}

    results = []
    for b in books:
        if args.ids:
            if b["id"] not in args.ids:
                continue
        elif b["cover"]:
            continue

        title = re.sub(r"\[[^\]]*\]", "", b["title"])
        title = re.sub(r"\s*\((книги.*?|tiptoi|EN)\)", "", title)
        title = re.sub(r"^.*№\d+\s+—\s+", "", title)
        title = re.sub(r"\s+", " ", title).strip()
        author = b["author"]
        author_unknown = "не указан" in author
        author_known = True
        if re.search(r"не указан|Сборник|Журнал|u\. a\.|серия|Langenscheidt|Ravensburger|^DK$|NGV|dtv|"
                     r"Zeit Weltkunst|Hueber|Klett|Verlag", author):
            author, author_known = "", False
        isbn_hint = ""
        state["min_score"] = 0.6
        h = hints.get(b["id"])
        if h:
            if h["query"]:
                title = h["query"]
            if h["author"] == "-":
                author, author_known = "", False
            elif h["author"]:
                author, author_known = h["author"], True
            isbn_hint = h["isbn"]
            if h["minscore"]:
                state["min_score"] = float(h["minscore"])

        def result(status, found=None, acand="", aconf=""):
            found = found or {}
            return {"id": b["id"], "status": status, "src": found.get("src", ""), "score": found.get("score", 0),
                    "url": found.get("url", ""), "matched": found.get("matched", ""),
                    "acand": acand, "aconf": aconf, "title": b["title"]}

        if "[уточнить" in b["title"] and len(words(title)) < 2 and not isbn_hint:
            results.append(result("SKIP"))
            continue

        found, authors, isbns = None, [], []
        if isbn_hint:
            found = cover_by_isbn([isbn_hint])

        if has_cyr(title) or has_cyr(author):
            order = ["labirint", "livelib", "openlibrary", "apple"]
        else:
            order = ["openlibrary", "apple"]
        sources = {"labirint": src_labirint, "livelib": src_livelib,
                   "openlibrary": src_openlibrary, "apple": src_apple}
        for step in order:
            if found and not author_unknown:
                break
            r = sources[step](title, author, author_known)
            if not r:
                continue
            if r.get("author"):
                authors.append(r["author"])
            isbns += r.get("isbns", [])
            if not found and r.get("url"):
                found = r
        if not has_cyr(title) and not has_cyr(author) and ((not found) or author_unknown):
            d = src_dnb_isbn(title, author)
            if d:
                if d.get("author"):
                    authors.append(d["author"])
                if author_known:
                    isbns += d["isbns"]
                    if not found:
                        found = cover_by_isbn(isbns)
        if not found and isbns:
            found = cover_by_isbn(isbns)

        # Autor fehlt auf dem Buchrücken: Kandidaten aus unabhängigen Quellen vergleichen
        #   yes      = Nachname bei mindestens zwei Quellen gleich (bestätigt)
        #   conflict = Quellen nennen verschiedene Autoren (mehrere Bücher mit diesem Titel)
        #   no       = nur ein oder kein Kandidat
        acand, aconf = "", ""
        if author_unknown and authors:
            acand = authors[0]
            sns = dedupe([norm(surname(a)) for a in authors if norm(surname(a))])
            agree = sum(1 for a in authors if norm(surname(acand)) in norm(a))
            if agree >= 2 and len(words(title)) >= 2:
                aconf = "yes"
            elif len(sns) >= 2 and agree < 2:
                aconf = "conflict"
            else:
                aconf = "no"
        unsure = (not author_known) and found and (
            aconf == "conflict" or (aconf != "yes" and len(words(title)) < 3))

        if found and unsure:
            results.append(result("UNSURE", found, acand, aconf))
        elif found:
            results.append(result("FOUND", found, acand, aconf))
        else:
            results.append(result("NONE", None, acand, aconf))
        r = results[-1]
        print("%4d  %-6s %-12s %s" % (r["id"], r["status"], r["src"], b["title"]))
        sys.stdout.flush()

    # ---- Bericht ----
    tsv = os.path.join(out_dir, "covers.tsv")
    with open(tsv, "w", encoding="utf-8") as f:
        f.write("id\tstatus\tsource\tscore\turl\tmatched\tauthor_candidate\tauthor_confirmed\ttitle\n")
        for r in results:
            f.write("\t".join(str(r[k]) for k in ("id", "status", "src", "score", "url", "matched",
                                                   "acand", "aconf", "title")) + "\n")

    # ---- Seite zur Sichtprüfung ----
    cards = []
    for r in results:
        if r["status"] not in ("FOUND", "UNSURE"):
            continue
        style = ' style="border:2px solid #d63031"' if r["status"] == "UNSURE" else ""
        extra = ""
        if r["status"] == "UNSURE":
            extra = '<br><b style="color:#d63031">NICHT ÜBERNOMMEN: Autor unklar (%s)</b>' % htmllib.escape(r["acand"])
        elif r["acand"]:
            extra = "<br>Autor: %s [%s]" % (htmllib.escape(r["acand"]), r["aconf"])
        cards.append('<div class=c%s><img src="%s"><b>%d</b> [%s %s]<br>%s<br><i>%s</i>%s</div>' % (
            style, htmllib.escape(r["url"]), r["id"], r["src"], r["score"],
            htmllib.escape(r["title"]), htmllib.escape(r["matched"]), extra))
    page = ("<!doctype html><meta charset=utf-8><style>body{font:12px sans-serif;margin:8px;background:#fff}"
            ".g{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.c{border:1px solid #ccc;padding:4px;"
            "text-align:center}img{width:100%;height:170px;object-fit:contain}</style><div class=g>"
            + "".join(cards) + "</div>")
    with open(os.path.join(out_dir, "review.html"), "w", encoding="utf-8") as f:
        f.write(page)

    # ---- Kandidaten-Cover zum Ansehen herunterladen (temporär, nicht ins Repo) ----
    if args.download_review:
        rdir = os.path.join(out_dir, "review")
        os.makedirs(rdir, exist_ok=True)
        for r in results:
            if r["status"] in ("FOUND", "UNSURE") and r["url"]:
                b = img_bytes(r["url"])
                if b:
                    with open(os.path.join(rdir, "%d.jpg" % r["id"]), "wb") as f:
                        f.write(b)
        print("Kandidaten-Cover zum Ansehen: " + rdir)

    # ---- in books-data.js schreiben ----
    if args.apply or args.apply_authors:
        shutil.copyfile(books_file, os.path.join(out_dir, "books-data.backup.js"))
        cover_map = {r["id"]: r["url"] for r in results
                     if args.apply and r["status"] == "FOUND" and r["url"]}
        author_map = {r["id"]: r["acand"] for r in results
                      if args.apply_authors and r["aconf"] == "yes" and r["acand"]}
        nl = "\r\n" if "\r\n" in text else "\n"
        out, cur, nc, na = [], None, 0, 0
        for line in re.split(r"\r?\n", text):
            m = re.match(r"^\s+id:\s*(\d+),\s*$", line)
            if m:
                cur = int(m.group(1))
            if cur is not None:
                if cur in cover_map and re.match(r'^\s+cover:\s*"",\s*$', line):
                    line = '    cover: "%s",' % cover_map[cur]
                    nc += 1
                elif cur in author_map and re.match(r'^\s+author:\s*".*не указан.*",\s*$', line):
                    line = '    author: "%s",' % author_map[cur].replace('"', "")
                    na += 1
            out.append(line)
        with open(books_file, "w", encoding="utf-8", newline="") as f:
            f.write(nl.join(out))
        print("geschrieben: %d Cover, %d Autoren" % (nc, na))

    n = lambda s: sum(1 for r in results if r["status"] == s)
    print("Summe: gefunden %d, unsicher (nicht übernommen) %d, nicht gefunden %d, übersprungen %d."
          % (n("FOUND"), n("UNSURE"), n("NONE"), n("SKIP")))
    print("Bericht: %s ; Prüfseite: %s" % (tsv, os.path.join(out_dir, "review.html")))


if __name__ == "__main__":
    main()
