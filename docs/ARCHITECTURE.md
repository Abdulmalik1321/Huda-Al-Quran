# Architecture

## Overview

Huda Al-Quran is an Expo (managed workflow) app using Expo Router for file-based navigation. Everything is offline: the full Quran text is a JSON file bundled into the JavaScript bundle and imported directly by the screens. There is no backend.

```
expo-router/entry
  └─ app/_layout.tsx        Stack navigator, DarkTheme, I18nManager.forceRTL(true)
       ├─ app/index.tsx     "index"  – home / surah list (header hidden)
       ├─ app/quran.tsx     "quran"  – surah reader, params { surah, verse }
       └─ app/+not-found.tsx
```

## Screens

### `app/_layout.tsx`
- Loads only the `SpaceMono` font, hides the splash screen when loaded.
- Calls `I18nManager.forceRTL(true)` inside a `useEffect`. This setting is persisted natively and only applies after a full reload, so the very first launch is LTR.
- Always uses `DarkTheme` (the `colorScheme` value is computed but unused).

### `app/index.tsx` (home)
- Loads the `othmani-1` font (`assets/fonts/Othmani.ttf`) with `useFonts`, but does not wait for it before rendering.
- Shows the Basmalah image, a verse (Al-Baqarah 2), and the endowment dedication text.
- "Continue where you stopped" button: reads `savedVerses` from AsyncStorage on every focus (`useFocusEffect`) and navigates to `quran` with `{ surah, verse }`.
- Search box filters `surahList` by `item.name` (Arabic name only).
- `FlatList` of surahs; tapping navigates to `quran` with `{ surah: item.id - 1, verse: 0 }`.

### `app/quran.tsx` (reader)
- Route params come from `useLocalSearchParams()` and are **strings** (`surah`, `verse`). The code relies on JS coercion (`quran[surah]`, `index == verse`, `verse < 1`).
- Sets the header title to `سورة <name>` in the `othmani-1` font.
- Renders the whole surah as **one outer `<Text>`** containing one nested `<Text>` per verse, followed by the verse number in Arabic-Indic digits (`convertToArabicNumerals`). This is what makes the text flow continuously like a Mushaf page, and it is the part affected by the RTL/justify issue (see `RTL_JUSTIFY.md`).
- Lazy rendering: `renderCount` verses are rendered; `handleScroll` adds 20 more when close to the bottom.
- Verses before the requested `verse` are skipped (rendered as empty fragments).
- Press-in highlights a verse after 150 ms; long-press (250 ms) opens `ActionSheetIOS` with "save verse" (writes `{ surah, verse }` to AsyncStorage key `savedVerses`) and "copy verse" (`expo-clipboard`).
- The Basmalah image is shown when starting from the beginning of a surah (`verse < 1`).
- A `scrollTo` runs 500 ms after mount using `verseCords`, which is never populated (no-op today).

## Data

### `assets/Quran.json` (used by the app, ~6 MB, UTF-8 **with BOM**)
Array of 114 surah objects (index = surah number − 1):

```jsonc
{
  "id": 2,
  "name": "البقرة",            // Arabic name (used for list + search + header)
  "name_en": "The Cow",
  "name_translation": "Al-Baqarah",
  "words": 6144, "letters": 25613,
  "type": "مدنية", "type_en": "medinan",
  "ar": "...",                  // whole surah as one string (inconsistent source, not used)
  "en": "...",                  // whole surah translation (not used)
  "array": [                    // verses, index = verse number − 1
    { "id": 1, "ar": "الٓمٓ", "en": "Alif, Lam, Meem",
      "filename": "002.mp3", "path": "/audio/002/001.mp3", "dir": "/audio/002", "size": 41402 }
  ]
}
```

Facts worth knowing:
- 6236 verses total. Verse text is Uthmani script (uses ٱ, small high letters, etc.).
- Al-Fatiha's verse 1 **is** the Basmalah; other surahs do not include it as a verse.
- 199 verses start with `۞` (rub' al-hizb mark) and 15 contain `۩` (sajdah mark). These are bidi-neutral characters; everything else is Arabic letters, marks and spaces (no Latin characters or digits in verse text).
- Audio fields reference files that are not in the repo.

### `assets/fonts/Othmani/` (KFGQPC Uthmanic Hafs v2.0 reference data, not used at runtime)
`hafsData_v2-0.{json,csv,sql,xml,txt,xlsx,html}` — 6236 rows with `jozz`, `page` (1–604), `sura_no`, `aya_no`, `line_start`/`line_end` (1–15, Madinah Mushaf layout), `aya_text` (with the font's own aya-end glyph after a no-break space), and `aya_text_emlaey` (plain spelling, good for search). This is the natural source for juz/page navigation, a Mushaf page mode, and diacritic-insensitive search.

### Storage
- AsyncStorage key `savedVerses` → `{"surah": number, "verse": number}` (0-based indices). Only one bookmark is kept.
- `assets/SavedVerses.json` is an unused empty array.

## Styling
- NativeWind 2 via `nativewind/babel`; `tailwind.config.js` scans `./app/**`. Font is applied with `font-[othmani-1]`.
- No `nativewind-env.d.ts`, so TypeScript does not know about `className` on RN components (source of many `tsc` errors).

## Unused / leftover files
- `components/*`, `hooks/*`, `constants/Colors.ts`, `scripts/reset-project.js` — Expo template (only `ThemedText`/`ThemedView` are used by `+not-found.tsx`).
- `assets/ChatGPT.html` + `assets/ChatGPT_files/` — a saved ChatGPT conversation (setup notes about Tailwind and RTL), not an app asset.
- `assets/fonts/Othmani.zip` (10 MB), `assets/fonts/Othmani-old.ttf`, `assets/images/react-logo*`, `partial-react-logo.png`.
