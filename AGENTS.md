# AGENTS.md — long-term memory for AI agents

Read this first in every session. Keep it short and current: update it whenever you learn something that a future session would otherwise have to rediscover. Log the work itself in `docs/DEVLOG.md`.

## Project in one paragraph
Huda Al-Quran (هدى القرآن): an offline Mushaf for Android and iOS (Expo SDK 51, React Native 0.74, Expo Router 3). Owner: Abdulmalik Almasud (GitHub `Abdulmalik1321`). The app is a charitable endowment (وقف). **Product scope, set by the owner:** behave like a real book with the printed Madinah Mushaf pages, work fully offline, always reopen on the last page read, and offer simple reading/memorization tools (bookmarks, memorization mode, progress, search). **No audio or other big features.**

## Where things are
- `app/index.tsx` reader (horizontal inverted `FlatList` of 604 pages), `components/MushafPage.tsx` page renderer, `components/VerseActions.tsx` long-press sheet.
- `app/contents.tsx`, `search.tsx`, `bookmarks.tsx`, `settings.tsx` navigate back with `store.jumpTo(page, verse?)`.
- `lib/quran.ts` data access (`pageLayout(page)`, `pageInfo`, `verse(i)`, `surahPages(n)`), `lib/store.tsx` persisted state, `lib/theme.ts`, `lib/arabic.ts`.
- `assets/mushaf/*.json` are **generated** by `scripts/build-mushaf.py` (needs `pip install uharfbuzz`). Never edit them by hand.
- Sources: `assets/fonts/Othmani/UthmanicHafs_v2-0 font/uthmanic_hafs_v2-0.docx` (line and page breaks) and `.../hafsData_v2-0.json` (text, page, line, juz; UTF-8 with BOM, use `utf-8-sig`). `assets/Quran.json` is used only for surah metadata.
- Font: `assets/fonts/Othmani.ttf` (KFGQPC Hafs v2.0), registered as `hafs` (`QURAN_FONT`). Verse-end glyphs are U+FC00 + (ayah − 1).
- AsyncStorage keys: `huda:lastPage`, `huda:bookmarks`, `huda:memorized`, `huda:settings`. The legacy `savedVerses` is migrated.
- Docs: `docs/ARCHITECTURE.md` (the details), `docs/ROADMAP.md`, `docs/DEVLOG.md`, `docs/RTL_JUSTIFY.md`.

## Key decisions
- Justification is done by **layout**: each line is a `row-reverse` row with `space-between` of word `Pressable`s. Do **not** use `textAlign: "justify"` for Arabic: on Android it is hard-wired to left alignment (see `docs/RTL_JUSTIFY.md`).
- Native layout direction stays **LTR** (`I18nManager.allowRTL(false)`). Arabic UI rows use `row-reverse` + `textAlign: "right"` explicitly. Old installs with `forceRTL(true)` are reset with one reload in `_layout.tsx`.
- Font size: `min(contentWidth / refLineEm, slot / 1.8)`. A line wider than the screen gets its own smaller font. Pages 1–2 and very short lines are centered.
- Verse index is global, 0…6235. Every Mushaf page ends on a verse ending (asserted in tests).

## Gotchas
- React Native Web: `Text.onLongPress` does nothing, which is why words are `Pressable`s. `dir="rtl"` on `<html>` flips `row-reverse`, so `+html.tsx` must not set it.
- Expo Router params are strings; convert with `Number()`.
- `npx expo lint` auto-installs eslint and edits `package.json` on first run. Revert if lint adoption was not requested.
- No Android/iOS emulator on the agent VM. Preview on web: `npx expo start --web` and screenshots with headless Chrome (`/usr/local/bin/google-chrome` + `puppeteer-core`). On web, `localStorage` holds the AsyncStorage keys, so you can preset `huda:lastPage` to open any page.
- Baseline: `npx tsc --noEmit` 0 errors; `npx jest --ci` 9 tests passing. Keep it that way.

## Conventions
- UI strings are Arabic; numbers shown with Arabic-Indic digits (`arabicNumber`). Use " – " as a separator, not "·", which looks like the Arabic zero "٠".
- Styling with `StyleSheet` and theme colors from `useStore().colors` (NativeWind is no longer used).
- Base branch for PRs: `AI-dev`. Agent branches: `cursor/<name>-17c7`. One logical change per commit.
- Every change: a `docs/DEVLOG.md` entry; update `docs/ROADMAP.md` and this file when facts change.

## Current priorities
1. Device testing on Android and iOS (checklist in `docs/ROADMAP.md`).
2. P1 simple features: hizb/quarter markers, daily reading goal, memorization review list.
3. Clean-up: remove unused dependencies and assets; Expo SDK upgrade before the store release.
