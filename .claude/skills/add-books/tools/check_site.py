#!/usr/bin/env python3
"""check_site.py - prüft home-library/books-data.js und die Cover-Links ohne Browser.

Prüft: doppelte ids/Titel, Genres außerhalb von GENRES, leere Genres, Feld contents (Sammelbände),
Sprache (language aus der Liste LANGUAGES in script.js), Serien (volume ganze Zahl, nur mit series),
lokale Cover (covers/<id>.jpg muss existieren und ein JPEG sein) und ob jeder Cover-Link ins Internet ein Bild
liefert (mit Referer der Seite, um Hotlink-Schutz zu erkennen). Rückgabecode 1, wenn etwas auffällt.

Beispiel:  python3 check_site.py
"""
import argparse
import os
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(os.path.dirname(HERE), "..", "..", ".."))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
REFERER = "https://igorssource.github.io/LibraryAtHome/"


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": REFERER})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
            ok = r.headers.get("Content-Type", "").lower().startswith("image") and len(data) > 3000
            return url, ok, len(data)
    except Exception as e:
        return url, False, str(e)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--books-file")
    ap.add_argument("--no-network", action="store_true", help="Cover-Links nicht abrufen")
    args = ap.parse_args()
    path = args.books_file or os.path.join(ROOT, "home-library", "books-data.js")
    with open(path, encoding="utf-8") as f:
        text = f.read()

    gm = re.search(r"const GENRES = \[(.*?)\];", text, re.S)
    allowed = re.findall(r'"([^"]+)"', gm.group(1)) if gm else []
    books = []
    for m in re.finditer(r'id:\s*(\d+),\s*title:\s*"(.*?)",\s*author:\s*"(.*?)",\s*genre:\s*\[(.*?)\],'
                         r'\s*cover:\s*"(.*?)",', text, re.S):
        books.append({"id": int(m.group(1)), "title": m.group(2), "author": m.group(3),
                      "genre": re.findall(r'"([^"]+)"', m.group(4)), "cover": m.group(5)})

    problems = []
    ids = [b["id"] for b in books]
    titles = [b["title"].lower() for b in books]
    problems += ["doppelte id: %d" % i for i in sorted(set(x for x in ids if ids.count(x) > 1))]
    problems += ["doppelter Titel: " + t for t in sorted(set(x for x in titles if titles.count(x) > 1))]
    # Sprachen, die die Seite kennt (LANGUAGES in script.js)
    langs = []
    script = os.path.join(os.path.dirname(path), "script.js")
    if os.path.exists(script):
        lm = re.search(r"const LANGUAGES = \{(.*?)\};", open(script, encoding="utf-8").read(), re.S)
        langs = re.findall(r"(\w+):\s*\"", lm.group(1)) if lm else []

    # contents: nur bei Sammelbänden, Liste von mindestens zwei nicht leeren Werktiteln
    starts = [m.start() for m in re.finditer(r'\bid:\s*\d+,', text)] + [len(text)]
    for k, b in enumerate(books):
        block = text[starts[k]:starts[k + 1]]
        lg = re.search(r'\blanguage:\s*"([^"]*)"', block)
        if not lg or not lg.group(1):
            problems.append("id %d: language fehlt" % b["id"])
        elif langs and lg.group(1) not in langs:
            problems.append("id %d: Sprache «%s» fehlt in LANGUAGES (script.js)" % (b["id"], lg.group(1)))
        vol = re.search(r'\bvolume:\s*([^,\n]*)', block)
        if vol and not re.fullmatch(r"\d+", vol.group(1).strip()):
            problems.append("id %d: volume muss eine ganze Zahl sein" % b["id"])
        if vol and not re.search(r'\bseries:\s*"[^"]+"', block):
            problems.append("id %d: volume ohne series" % b["id"])
        cm = re.search(r'\bcontents:\s*\[(.*?)\]', block, re.S)
        b["contents"] = re.findall(r'"([^"]*)"', cm.group(1)) if cm else []
        if cm and (len(b["contents"]) < 2 or not all(w.strip() for w in b["contents"])):
            problems.append("id %d: contents braucht mindestens zwei nicht leere Werke" % b["id"])
    for b in books:
        for g in b["genre"]:
            if g not in allowed:
                problems.append("id %d: unbekanntes Genre «%s»" % (b["id"], g))
    no_genre = [b for b in books if not b["genre"]]
    no_cover = [b for b in books if not b["cover"]]

    broken = []
    site_dir = os.path.dirname(path)
    for b in books:
        if b["cover"] and not b["cover"].startswith("http"):
            f = os.path.join(site_dir, b["cover"])
            ok = os.path.isfile(f) and os.path.getsize(f) > 3000 and open(f, "rb").read(3) == b"\xff\xd8\xff"
            if not ok:
                broken.append("id %d «%s»: lokale Datei fehlt oder ist kein JPEG: %s" % (b["id"], b["title"], b["cover"]))
    if not args.no_network:
        urls = [b["cover"] for b in books if b["cover"].startswith("http")]
        with ThreadPoolExecutor(max_workers=8) as ex:
            res = {u: (ok, info) for u, ok, info in ex.map(fetch, urls)}
        for b in books:
            if b["cover"].startswith("http") and not res[b["cover"]][0]:
                broken.append("id %d «%s»: %s (%s)" % (b["id"], b["title"], b["cover"], res[b["cover"]][1]))

    local = sum(1 for b in books if b["cover"] and not b["cover"].startswith("http"))
    print("Bücher: %d, mit Cover: %d (davon als Kopie in covers/: %d), ohne Cover: %d, ohne Genre: %d, Sammelbände: %d"
          % (len(books), len(books) - len(no_cover), local, len(no_cover), len(no_genre),
             sum(1 for b in books if b["contents"])))
    for p in problems:
        print("PROBLEM: " + p)
    for p in broken:
        print("KAPUTTER COVER-LINK: " + p)
    if no_genre:
        print("ohne Genre: " + ", ".join("%d" % b["id"] for b in no_genre))
    if problems or broken:
        sys.exit(1)
    print("OK")


if __name__ == "__main__":
    main()
