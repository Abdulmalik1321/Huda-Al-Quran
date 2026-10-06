# Architecture

## Overview

Huda Al-Quran is an offline Mushaf reader built with Expo (managed workflow) and Expo Router. The app shows the 604 pages of the Madinah Mushaf with exactly the printed page and line layout, and reopens on the last page the user read. Everything is bundled; there is no backend and no network use.

```
expo-router/entry
  └─ app/_layout.tsx       StoreProvider, loads the Quran font + saved state, then hides the splash
       ├─ app/index.tsx    Reader (the Mushaf). Header hidden. Opens on the last page.
       ├─ app/contents.tsx الفهرس: surahs / juz, go to page, memorization progress
       ├─ app/search.tsx   البحث: verse search (diacritic-insensitive)
       ├─ app/bookmarks.tsx العلامات: page and verse bookmarks
       ├─ app/settings.tsx الإعدادات: theme, keep awake, memorization hint, help, credits
       └─ app/+not-found.tsx
lib/
  quran.ts     Data access: pages, lines, words, verses, surahs, juz, page info
  store.tsx    App state + AsyncStorage persistence (React context)
  theme.ts     Light / sepia / dark palettes, Quran font family name
  arabic.ts    Arabic-Indic digits, Arabic normalization for search
components/
  MushafPage.tsx   Renders one page (header, 15 lines, footer)
  VerseActions.tsx Bottom sheet for a long-pressed verse
scripts/
  build-mushaf.py  Generates assets/mushaf/*.json from the KFGQPC sources
```

## Data pipeline

The page layout comes from the **KFGQPC Uthmanic Hafs v2.0** package already in the repo (`assets/fonts/Othmani/`), which is the source the font was made for:

- `UthmanicHafs_v2-0 font/uthmanic_hafs_v2-0.docx`: the whole Mushaf as a Word document. It has 603 page breaks (604 pages) and a line break at the end of every Mushaf line. Pages 1–2 have 8 lines and every other page has 15.
- `UthmanicHafs_v2-0 data/hafsData_v2-0.json`: one row per verse with the text (`aya_text`, ending with the font's verse-end glyph U+FC00–U+FDFF), `page`, `line_start`/`line_end`, `jozz`, and a plain spelling (`aya_text_emlaey`) for search.
- `assets/Quran.json`: used only for surah metadata (English transliteration, Meccan/Medinan). Its verse text is the same Uthmani text and differs only in tatweel (ـ) characters.

`scripts/build-mushaf.py` (`pip install uharfbuzz && python3 scripts/build-mushaf.py`):
1. Reads the docx lines and pages.
2. Classifies each line as a surah title (`سُورَةُ …`), a Basmalah (the line after a title, except surahs 1 and 9), or a text line.
3. Walks the words of the text lines. The Arabic-Indic number at each verse end closes the current verse, and the words are taken from `hafsData` (the docx uses a different mark order; they are compared after NFC normalization).
4. **Validates** every verse: word count, words, verse number, and that the verse ends on the page and line given by `hafsData`. The script exits on any mismatch. Today all 6236 verses match.
5. Shapes every line with HarfBuzz to get its natural width in em (`w`). Pages 1–2 and lines narrower than 55% of a full line are flagged as centered (`c`).
6. Writes:
   - `assets/mushaf/pages.json` (1.6 MB): `pages[page-1][line]` is one of `{h: surah}` (title), `{b: text}` (Basmalah), or `{t: "w1 w2 …", v: [[verseIndex, wordCount], …], w: widthEm, c?: 1}`.
   - `assets/mushaf/meta.json`: `surahs` (n, name, en, type, ayahs, page), `juz` starts, `verses[i] = [surah, ayah, page, juz]`, `refLineEm` (95th percentile line width), `maxLineEm`.
   - `assets/mushaf/text.json`: verse text without the end mark (copy, share, previews). Loaded on first use.
   - `assets/mushaf/search.json`: `aya_text_emlaey` per verse. Loaded on first search.

Facts worth knowing: verse index `i` is global (0 … 6235, in Mushaf order). Every page of this Mushaf ends on a verse ending, so a verse never runs over two pages. The surah title frame is `assets/images/surah-frame.png`, taken from the docx.

## Rendering a page (`components/MushafPage.tsx`)

- `pageMetrics()` derives the sizes from the window and safe-area insets: a header row (surah names, juz), 15 equal line slots, and a footer (page number, bookmark and memorized icons). The font size is `min(contentWidth / refLineEm, slot / 1.8)`. The font's natural line height is 1.76 em.
- Each text line is a `View` with `flexDirection: "row-reverse"` and `justifyContent: "space-between"`, and each word is its own `Pressable` + `Text`. **Justification is done by layout, not by the text engine**, so it looks the same on Android, iOS and web, and does not depend on `textAlign: "justify"`, `writingDirection` or `I18nManager` (the old reader's RTL problem, see `RTL_JUSTIFY.md`). A line wider than the screen at the base size gets a slightly smaller font, only for that line.
- Centered lines (`c`) use `justifyContent: "center"` with a small word margin.
- The verse-end glyph is drawn by the font (with the number inside) in the `marker` color.
- `ROW_RTL` falls back to `"row"` if the native layout is still RTL.

## Reader (`app/index.tsx`)

- A horizontal `FlatList` of the 604 pages, `inverted` + `pagingEnabled`, so page 1 is on the right and the next page comes from the left, like an Arabic book. `getItemLayout` plus `initialScrollIndex = lastPage - 1` opens directly on the saved page. `windowSize: 3` keeps only nearby pages mounted.
- `onViewableItemsChanged` updates the current page and persists `lastPage`.
- Tapping the page toggles the top bar (contents, search, bookmarks, settings, title) and the bottom bar (bookmark page, memorization mode, mark page memorized).
- Long-pressing a word highlights its verse and opens `VerseActions` (bookmark verse, memorize from here, copy, share).
- **Memorization mode**: the words of the page are masked (same size, `mask` color) except the verse-end marks. The state is `revealed[page]`, the number of words revealed in reading order. Tapping a word reveals up to it, and the bar has buttons for next word, next verse, hide all, show all, and exit. An optional hint keeps the first word of every verse visible. While memorizing, the page shrinks so the bar never covers a line.
- Other screens navigate back to the reader with `store.jumpTo(page, verse?)`. The reader scrolls to the page and highlights the verse.
- The screen is kept awake while reading (`expo-keep-awake`, configurable).

## State (`lib/store.tsx`)

React context backed by AsyncStorage (localStorage on web):

| Key | Value |
| --- | --- |
| `huda:lastPage` | page number (string) |
| `huda:bookmarks` | `[{ id: "p<page>" or "v<verseIndex>", page, verse?, createdAt }]`, newest first |
| `huda:memorized` | array of page numbers marked as memorized |
| `huda:settings` | `{ theme: "system" or "light" or "sepia" or "dark", keepAwake, hintFirstWord }` |
| `savedVerses` | legacy `{ surah, verse }` (0-based) from the first version, migrated to a bookmark + last page on first launch |

`_layout.tsx` waits for the store and the font before hiding the splash screen, so the reader mounts on the correct page.

## Layout direction

The native layout direction is kept **LTR**: `I18nManager.allowRTL(false)`. If an older install had `forceRTL(true)` persisted, the app resets it and reloads once. Arabic UI rows use `row-reverse` and `textAlign: "right"` explicitly, and the Mushaf pages handle their own right-to-left order. `+html.tsx` no longer sets `dir="rtl"` for the same reason.

## Testing

- `npx jest --ci`: `lib/__tests__/quran-test.ts` checks the data (604 pages, line counts, all 6236 verses in order, surah page ranges, pages end on verse endings) and the Arabic helpers.
- `npx tsc --noEmit`: clean.
- Web preview (`npx expo start --web`) renders the same components through react-native-web, which is useful for checking layout without a device. Native testing on Android and iOS (Expo Go SDK 51) is still required.

## Leftover files
- `components/ThemedText.tsx`, `ThemedView.tsx`, `hooks/*`, `constants/Colors.ts`: Expo template, used only by `+not-found.tsx` and the template test.
- `assets/ChatGPT.html` + `assets/ChatGPT_files/` (saved chat), `assets/fonts/Othmani.zip` (10 MB duplicate of `assets/fonts/Othmani/`), `Othmani-old.ttf`, `react-logo*` images, `assets/SavedVerses.json`, `tailwind.config.js` / NativeWind (no longer used by app code).
