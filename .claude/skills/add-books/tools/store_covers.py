#!/usr/bin/env python3
"""store_covers.py - legt Kopien der Cover in home-library/covers/ ab.

Für jedes Buch, dessen cover noch ein Link ins Internet ist, wird das Bild geladen, auf höchstens
MAX_WIDTH Pixel Breite verkleinert (größer wird nichts) und als covers/<id>.jpg gespeichert.
In books-data.js wird dann  cover: "covers/<id>.jpg"  eingetragen und der ursprüngliche Link als
coverSource: "<url>"  direkt darunter aufbewahrt (zum erneuten Laden).

Verkleinern braucht Pillow; ohne Pillow wird das Bild unverändert gespeichert, wenn es ein JPEG ist.
Was nicht geladen werden kann (Netz gesperrt, Link tot), bleibt als Link stehen und wird gemeldet.

Beispiele:
  python3 store_covers.py                 # alle Bücher mit Link-Cover
  python3 store_covers.py --ids 190 191   # nur diese
  python3 store_covers.py --refresh --ids 29   # Kopie aus coverSource neu laden
"""
import argparse
import io
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(os.path.dirname(HERE), "..", "..", ".."))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
MAX_WIDTH = 800      # Karte ist ~220 px breit, auf scharfen Bildschirmen ~440 px: 800 px lässt Reserve
JPEG_QUALITY = 90

try:
    from PIL import Image
except ImportError:
    Image = None


def larger_variant(url):
    """Apple Books (mzstatic) liefert jede Größe: statt 600x600 die große Fassung laden."""
    m = re.search(r"/(\d+)x(\d+)bb\.jpg$", url)
    if "mzstatic.com" in url and m and int(m.group(1)) < 1400:
        return url[:m.start()] + "/1400x1400bb.jpg"
    return None


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        data = r.read()
        ctype = r.headers.get("Content-Type", "").lower()
    if not ctype.startswith("image") or len(data) < 3000:
        raise ValueError("kein Bild (%s, %d Bytes)" % (ctype or "?", len(data)))
    return data


def to_jpeg(data):
    if Image is None:
        if data[:3] != b"\xff\xd8\xff":
            raise ValueError("kein JPEG und Pillow fehlt")
        return data, None
    im = Image.open(io.BytesIO(data))
    im = im.convert("RGB")
    if im.width > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(im.height * MAX_WIDTH / im.width)), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return out.getvalue(), im.size


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--books-file")
    ap.add_argument("--ids", type=int, nargs="*")
    ap.add_argument("--refresh", action="store_true", help="vorhandene Kopie aus coverSource neu laden")
    args = ap.parse_args()

    books_file = args.books_file or os.path.join(ROOT, "home-library", "books-data.js")
    covers_dir = os.path.join(os.path.dirname(books_file), "covers")
    os.makedirs(covers_dir, exist_ok=True)
    with open(books_file, encoding="utf-8", newline="") as f:
        text = f.read()
    nl = "\r\n" if "\r\n" in text else "\n"

    stored, failed = [], []
    lines = re.split(r"\r?\n", text)
    out, cur, k = [], None, 0
    while k < len(lines):
        line = lines[k]
        m = re.match(r"^\s+id:\s*(\d+),\s*$", line)
        if m:
            cur = int(m.group(1))
        cm = re.match(r'^(\s+)cover:\s*"(.*)",\s*$', line)
        if cm and cur is not None and (not args.ids or cur in args.ids):
            indent, value = cm.group(1), cm.group(2)
            nxt = lines[k + 1] if k + 1 < len(lines) else ""
            sm = re.match(r'^\s+coverSource:\s*"(.*)",\s*$', nxt)
            source = None
            if value.startswith("http"):
                source = value
            elif args.refresh and sm:
                source = sm.group(1)
            if source:
                try:
                    big = larger_variant(source)
                    try:
                        raw = fetch(big) if big else fetch(source)
                    except Exception:
                        raw = fetch(source)
                    data, size = to_jpeg(raw)
                    name = "covers/%d.jpg" % cur
                    with open(os.path.join(covers_dir, "%d.jpg" % cur), "wb") as f:
                        f.write(data)
                    out.append('%scover: "%s",' % (indent, name))
                    out.append('%scoverSource: "%s",' % (indent, source))
                    if sm:
                        k += 1          # alte coverSource-Zeile ersetzt
                    stored.append("id %d: %s, %d KB%s" % (cur, name, len(data) // 1024,
                                                          ", %dx%d" % size if size else ""))
                    k += 1
                    continue
                except Exception as e:
                    failed.append("id %d: %s (%s)" % (cur, source, e))
        out.append(line)
        k += 1

    if stored:
        with open(books_file, "w", encoding="utf-8", newline="") as f:
            f.write(nl.join(out))
    print("gespeichert: %d" % len(stored))
    for s in stored:
        print("  + " + s)
    if failed:
        print("nicht geladen (bleibt als Link): %d" % len(failed))
        for s in failed:
            print("  ! " + s)
    if Image is None:
        print("Hinweis: Pillow fehlt, Bilder wurden nicht verkleinert (pip install Pillow)")


if __name__ == "__main__":
    main()
