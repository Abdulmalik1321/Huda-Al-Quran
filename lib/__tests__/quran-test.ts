import { arabicNumber, normalizeArabic, parseNumber } from "../arabic";
import { PAGE_COUNT, pageInfo, pageLayout, pages, surahPages, surahs, verse, verseIndex } from "../quran";

describe("mushaf data", () => {
  it("has the 604 pages of the Madinah Mushaf with 15 lines each (8 on the first two)", () => {
    expect(PAGE_COUNT).toBe(604);
    expect(pages[0]).toHaveLength(8);
    expect(pages[1]).toHaveLength(8);
    expect(pages.slice(2).every((p) => p.length === 15)).toBe(true);
  });

  it("covers every verse exactly once and in order", () => {
    const seen: number[] = [];
    for (let p = 1; p <= PAGE_COUNT; p++) {
      for (const w of pageLayout(p).words) if (w.isMark) seen.push(w.verse);
    }
    expect(seen).toHaveLength(6236);
    expect(seen.every((v, i) => v === i)).toBe(true);
  });

  it("knows where surahs start and end", () => {
    expect(surahs).toHaveLength(114);
    expect(surahPages(1)).toEqual([1, 1]);
    expect(surahPages(2)).toEqual([2, 49]);
    expect(surahPages(114)).toEqual([604, 604]);
    expect(pageInfo[603].surahs).toEqual([112, 113, 114]);
  });

  it("maps verses to the page they start on", () => {
    expect(verse(verseIndex(2, 255)).page).toBe(42);
    expect(verse(verseIndex(18, 1)).page).toBe(293);
  });

  it("ends every page on a verse ending, like the printed Madinah Mushaf", () => {
    for (let p = 1; p <= PAGE_COUNT; p++) {
      const words = pageLayout(p).words;
      expect(words[words.length - 1].isMark).toBe(true);
      expect(words[0].firstOfVerse).toBe(true);
    }
  });

  it("marks the first word of each verse", () => {
    const words = pageLayout(3).words;
    const afterMark = words.findIndex((w) => w.isMark) + 1;
    expect(words[afterMark].firstOfVerse).toBe(true);
    expect(words[afterMark + 1].firstOfVerse).toBe(false);
  });
});

describe("arabic helpers", () => {
  it("converts numbers both ways", () => {
    expect(arabicNumber(604)).toBe("٦٠٤");
    expect(parseNumber("٦٠٤")).toBe(604);
    expect(parseNumber("12")).toBe(12);
  });

  it("ignores diacritics and letter variants when searching", () => {
    expect(normalizeArabic("ٱلۡحَمۡدُ لِلَّهِ")).toBe(normalizeArabic("الحمد لله"));
    expect(normalizeArabic("إِيَّاكَ")).toBe("اياك");
  });
});
