const DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function arabicNumber(n: number): string {
  return String(n)
    .split("")
    .map((d) => DIGITS[Number(d)] ?? d)
    .join("");
}

const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

/** Simplifies Arabic for matching: no diacritics or tatweel, unified alef / yaa / hamza forms. */
export function normalizeArabic(s: string): string {
  return s
    .replace(TASHKEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Parses Arabic-Indic or Latin digits. */
export function parseNumber(s: string): number {
  const latin = s.replace(/[٠-٩]/g, (d) => String(DIGITS.indexOf(d)));
  return parseInt(latin, 10);
}
