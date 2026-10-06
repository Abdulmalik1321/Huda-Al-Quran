#!/usr/bin/env python3
"""Build the Mushaf page data used by the app (assets/mushaf/*.json).

Sources (KFGQPC Uthmanic Hafs v2.0, shipped in assets/fonts/Othmani/):
  - uthmanic_hafs_v2-0.docx : the printed Madinah Mushaf layout. Every page break
    and line break of the 604 pages / 15 lines is encoded in the document.
  - hafsData_v2-0.json      : verse text matched to the font, page / line / juz
    per verse, and a plain spelling (aya_text_emlaey) used for search.
  - assets/Quran.json       : surah metadata (English names, revelation type).

The docx gives the line breaks, the JSON gives the verse text. Every verse is
cross-checked (word count, words, verse number, page and line) and the script
fails on any mismatch.

Usage:  pip install uharfbuzz && python3 scripts/build-mushaf.py
"""
import html
import json
import os
import re
import sys
import unicodedata
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KFGQPC = os.path.join(ROOT, "assets", "fonts", "Othmani")
DOCX = os.path.join(KFGQPC, "UthmanicHafs_v2-0 font", "uthmanic_hafs_v2-0.docx")
HAFS = os.path.join(KFGQPC, "UthmanicHafs_v2-0 data", "hafsData_v2-0.json")
QURAN = os.path.join(ROOT, "assets", "Quran.json")
FONT = os.path.join(ROOT, "assets", "fonts", "Othmani.ttf")
OUT = os.path.join(ROOT, "assets", "mushaf")

NBSP = "\xa0"
DIGITS = re.compile(r"^[٠-٩]+$")


def nfc(s):
    return unicodedata.normalize("NFC", s)


def read_docx_pages():
    with zipfile.ZipFile(DOCX) as z:
        xml = z.read("word/document.xml").decode("utf-8")
    body = xml[xml.index("<w:body>"):]
    tokens = re.finditer(
        r'<w:p[ >]|</w:p>|<w:t[^>]*>(.*?)</w:t>|<w:br w:type="page"/>|<w:br/>', body, flags=re.S
    )
    pages, line = [[]], []

    def flush():
        text = "".join(line).strip()
        if text:
            pages[-1].append(text)
        line.clear()

    for m in tokens:
        tag = m.group(0)
        if tag.startswith("<w:br w:type"):
            flush()
            pages.append([])
        elif tag.startswith("<w:p") or tag in ("</w:p>", "<w:br/>"):
            flush()
        else:
            line.append(html.unescape(m.group(1)))
    flush()
    return pages


def split_aya(text):
    words = text.replace(NBSP, " ").split()
    mark = words[-1]
    assert len(mark) == 1 and 0xFC00 <= ord(mark) <= 0xFDFF, mark
    return words[:-1], mark


def main():
    hafs = json.load(open(HAFS, encoding="utf-8-sig"))
    quran = json.load(open(QURAN, encoding="utf-8-sig"))
    pages_raw = read_docx_pages()
    assert len(pages_raw) == 604, len(pages_raw)

    try:
        import uharfbuzz as hb

        hb_font = hb.Font(hb.Face(hb.Blob.from_file_path(FONT)))
        upem = hb_font.face.upem

        def width(text):
            buf = hb.Buffer()
            buf.add_str(text)
            buf.guess_segment_properties()
            hb.shape(hb_font, buf)
            return sum(p.x_advance for p in buf.glyph_positions) / upem
    except ImportError:
        sys.exit("uharfbuzz is required: pip install uharfbuzz")

    verse_words = [split_aya(h["aya_text"]) for h in hafs]
    pages, errors = [], []
    vi, consumed = 0, []
    line_widths = []

    for pi, raw_lines in enumerate(pages_raw):
        page_no = pi + 1
        lines = []
        prev_header = False
        for li, raw in enumerate(raw_lines):
            line_no = li + 1
            h = hafs[vi] if vi < len(hafs) else None
            if raw.startswith("سُورَةُ"):
                lines.append({"h": h["sura_no"]})
                prev_header = True
                continue
            if prev_header and h["aya_no"] == 1 and h["sura_no"] not in (1, 9):
                lines.append({"b": raw})
                prev_header = False
                continue
            prev_header = False

            text_words, runs = [], []
            for token in raw.replace(NBSP, " ").split():
                words, mark = verse_words[vi]
                if DIGITS.match(token):
                    number = int("".join(str(unicodedata.digit(c)) for c in token))
                    h = hafs[vi]
                    if number != h["aya_no"] or [nfc(w) for w in words] != [nfc(w) for w in consumed]:
                        errors.append(f"text {h['sura_no']}:{h['aya_no']}")
                    if h["page"] != page_no or h["line_end"] != line_no:
                        errors.append(f"position {h['sura_no']}:{h['aya_no']}")
                    word = mark
                    consumed = []
                    current = vi
                    vi += 1
                else:
                    if len(consumed) >= len(words):
                        sys.exit(f"overflow at page {page_no} line {line_no}")
                    word = words[len(consumed)]
                    consumed.append(token)
                    current = vi
                text_words.append(word)
                if runs and runs[-1][0] == current:
                    runs[-1][1] += 1
                else:
                    runs.append([current, 1])
            natural = sum(width(w) for w in text_words) + width(" ") * (len(text_words) - 1)
            line_widths.append((natural, page_no, line_no, len(lines)))
            lines.append({"t": " ".join(text_words), "v": runs})
        pages.append(lines)

    if vi != len(hafs):
        errors.append(f"consumed {vi} verses of {len(hafs)}")
    if errors:
        sys.exit("validation failed:\n" + "\n".join(errors[:50]))

    # "w" is the natural width of the line in em, so the app can pick one font
    # size for the page and shrink only the lines that would not fit. Pages 1-2
    # and very short lines (some surah endings in juz 30) are centered instead
    # of stretched; every other line is justified.
    full = sorted(w for w, *_ in line_widths)
    median = full[len(full) // 2]
    ref = full[int(len(full) * 0.95)]
    for natural, page_no, line_no, idx in line_widths:
        line = pages[page_no - 1][idx]
        line["w"] = round(natural, 2)
        if page_no <= 2 or natural < 0.55 * ref:
            line["c"] = 1
    max_width_em = max(full)

    surahs = []
    for s in quran:
        first = next(h for h in hafs if h["sura_no"] == s["id"])
        surahs.append(
            {
                "n": s["id"],
                "name": s["name"],
                "en": s["name_translation"],
                "type": s["type"],
                "ayahs": len(s["array"]),
                "page": first["page"],
            }
        )
    juz = []
    for h in hafs:
        if not juz or juz[-1]["juz"] != h["jozz"]:
            juz.append({"juz": h["jozz"], "page": h["page"], "s": h["sura_no"], "a": h["aya_no"]})

    meta = {
        "pageCount": len(pages),
        "maxLineEm": round(max_width_em, 2),
        # 95th percentile of line widths: the reference line for the base font size
        "refLineEm": round(ref, 2),
        "surahs": surahs,
        "juz": juz,
        # verse index -> [surah, ayah, page, juz]
        "verses": [[h["sura_no"], h["aya_no"], h["page"], h["jozz"]] for h in hafs],
    }
    search = [h["aya_text_emlaey"] for h in hafs]
    verse_text = [" ".join(w) for w, _ in verse_words]

    os.makedirs(OUT, exist_ok=True)
    dump = lambda name, data: json.dump(
        data, open(os.path.join(OUT, name), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":")
    )
    dump("pages.json", pages)
    dump("meta.json", meta)
    dump("search.json", search)
    dump("text.json", verse_text)
    print(f"ok: {len(pages)} pages, {vi} verses, max line {max_width_em:.2f} em, median {median:.2f} em")


if __name__ == "__main__":
    main()
