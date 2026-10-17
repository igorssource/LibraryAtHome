#!/usr/bin/env python3
"""check_site.py - prüft home-library/books-data.js und die Cover-Links ohne Browser.

Prüft: doppelte ids/Titel, Genres außerhalb von GENRES, leere Genres, und ob jeder Cover-Link ein Bild liefert
(mit Referer der Seite, um Hotlink-Schutz zu erkennen). Rückgabecode 1, wenn etwas auffällt.

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
    for b in books:
        for g in b["genre"]:
            if g not in allowed:
                problems.append("id %d: unbekanntes Genre «%s»" % (b["id"], g))
    no_genre = [b for b in books if not b["genre"]]
    no_cover = [b for b in books if not b["cover"]]

    broken = []
    if not args.no_network:
        urls = [b["cover"] for b in books if b["cover"]]
        with ThreadPoolExecutor(max_workers=8) as ex:
            res = {u: (ok, info) for u, ok, info in ex.map(fetch, urls)}
        for b in books:
            if b["cover"] and not res[b["cover"]][0]:
                broken.append("id %d «%s»: %s (%s)" % (b["id"], b["title"], b["cover"], res[b["cover"]][1]))

    print("Bücher: %d, mit Cover: %d, ohne Cover: %d, ohne Genre: %d"
          % (len(books), len(books) - len(no_cover), len(no_cover), len(no_genre)))
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
