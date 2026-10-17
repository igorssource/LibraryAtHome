#!/usr/bin/env python3
"""add_entries.py - fügt neue Bücher in home-library/books-data.js ein.

Python-Version von scripts/add-entries.ps1 (für Cloud-Sitzungen unter Linux; nur Standardbibliothek).

Eingabedatei (UTF-8), eine Zeile pro Buch:   Titel|Autor|Genre1;Genre2|Beschreibung
  - Zeile mit # am Anfang = Abschnittsüberschrift (kommt als Kommentar in die Datei)
  - Genres nur aus GENRES; unbekannte Genres werden verworfen und gemeldet
  - leere Genres sind erlaubt:  Titel|Autor||Beschreibung
Duplikate (gleicher Titel und gleicher Autor, Bandnummern werden beachtet) werden übersprungen.

Beispiel:  python3 add_entries.py ../work/new-books.txt
"""
import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL = os.path.dirname(HERE)                      # .claude/skills/add-books
ROOT = os.path.abspath(os.path.join(SKILL, "..", "..", ".."))  # Projektwurzel
PALETTE = ["#6c5ce7", "#0984e3", "#00b894", "#e17055", "#fdcb6e", "#d63031", "#2d3436",
           "#636e72", "#e84393", "#00cec9", "#a29bfe", "#74b9ff", "#fab1a0", "#fd79a8"]


def norm(s):
    s = s.lower().replace("ё", "е")
    return re.sub(r"[\W_]+", " ", s).strip()


def words(s):
    return [w for w in norm(s).split() if len(w) >= 3]


def title_score(want, have):
    w = words(want)
    if not w:
        return 0.0
    hv = words(have)
    if not hv:
        return 0.0
    hn, wn = norm(have), norm(want)
    recall = sum(1 for x in w if x in hn) / len(w)
    prec = sum(1 for x in hv if x in wn) / len(hv)
    return min(recall, prec)


def nums_ok(want, have):
    """Bandnummern aus dem gesuchten Titel müssen im anderen Titel vorkommen."""
    hn = norm(have)
    for n in re.findall(r"(?<!\w)\d{1,3}(?!\w)", norm(want)):
        if not re.search(r"(?<!\w)%s(?!\w)" % n, hn):
            return False
    return True


def author_unknown(a):
    return (not a.strip()) or re.search(r"не указан|Сборник|Журнал|u\. a\.|серия", a) is not None


def authors_overlap(a, b):
    if author_unknown(a) or author_unknown(b):
        return True
    hb = norm(b)
    return any(w in hb for w in words(a))


def same_book(t1, a1, t2, a2):
    return (title_score(t1, t2) >= 0.9 and nums_ok(t1, t2) and nums_ok(t2, t1)
            and authors_overlap(a1, a2))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input_file")
    ap.add_argument("--books-file")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    books_file = args.books_file or os.path.join(ROOT, "home-library", "books-data.js")
    with open(books_file, encoding="utf-8", newline="") as f:
        text = f.read()
    nl = "\r\n" if "\r\n" in text else "\n"

    gm = re.search(r"const GENRES = \[(.*?)\];", text, re.S)
    allowed = re.findall(r'"([^"]+)"', gm.group(1)) if gm else []
    existing = [{"id": int(m.group(1)), "title": m.group(2), "author": m.group(3)}
                for m in re.finditer(r'id:\s*(\d+),\s*title:\s*"(.*?)",\s*author:\s*"(.*?)"', text, re.S)]
    last_id = max((e["id"] for e in existing), default=0)

    cur_id = last_id
    added, skipped, warn = [], [], []
    parts = []          # fertige Textblöcke
    batch = []          # in diesem Lauf hinzugefügte Bücher (für Duplikate untereinander)
    pending_comment = None

    with open(args.input_file, encoding="utf-8") as f:
        lines = f.read().splitlines()
    for line in lines:
        if not line.strip():
            continue
        if line.startswith("#"):
            pending_comment = "  // ==== " + line[1:].strip() + " ===="
            continue
        fields = line.split("|")
        if len(fields) != 4:
            warn.append("falsches Format (4 Felder mit | nötig): " + line)
            continue
        title, author, genre_str, desc = [x.strip() for x in fields]
        if re.search(r'["\\]', title + author + desc):
            warn.append("Anführungszeichen oder Backslash in den Feldern, übersprungen: " + title)
            continue

        dup = next((e for e in existing + batch if same_book(title, author, e["title"], e["author"])), None)
        if dup:
            skipped.append("Duplikat: «%s» = id %d «%s»" % (title, dup["id"], dup["title"]))
            continue

        genres = []
        names = [x.strip() for x in genre_str.split(";")] if genre_str else []
        for g in names:
            if g in allowed:
                genres.append(g)
            elif g:
                warn.append("unbekanntes Genre «%s» bei «%s», verworfen (Vorschlag im Bericht nennen)" % (g, title))

        cur_id += 1
        batch.append({"id": cur_id, "title": title, "author": author})
        color = PALETTE[cur_id % len(PALETTE)]
        gjs = ", ".join('"%s"' % g for g in genres)
        if pending_comment:
            parts.append(nl + pending_comment)
            pending_comment = None
        block = nl.join([
            "  {",
            "    id: %d," % cur_id,
            '    title: "%s",' % title,
            '    author: "%s",' % author,
            "    genre: [%s]," % gjs,
            '    cover: "",',
            '    color: "%s",' % color,
            '    description: "%s"' % desc,
            "  }",
        ])
        parts.append(block + ",")
        added.append("id %d «%s»" % (cur_id, title))

    if added and not args.dry_run:
        new_text = nl.join(parts).rstrip().rstrip(",")
        marker = nl + "  }" + nl + "];"
        idx = text.rfind(marker)
        if idx < 0:
            sys.exit("Ende des Arrays BOOKS in %s nicht gefunden" % books_file)
        result = text[:idx] + nl + "  }," + nl + new_text + nl + "];" + text[idx + len(marker):]
        with open(books_file, "w", encoding="utf-8", newline="") as f:
            f.write(result)

    print("hinzugefügt: %d%s" % (len(added), " (Probelauf, Datei unverändert)" if args.dry_run else ""))
    for a in added:
        print("  + " + a)
    if skipped:
        print("Duplikate übersprungen: %d" % len(skipped))
        for s in skipped:
            print("  = " + s)
    if warn:
        print("Warnungen:")
        for w in warn:
            print("  ! " + w)


if __name__ == "__main__":
    main()
