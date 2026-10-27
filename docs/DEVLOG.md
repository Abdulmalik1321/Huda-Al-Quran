# Development log

Newest entries first. Add an entry for every meaningful change: date, who, what changed, why, and what is next.

---

## 2026-10-06 — v2: page-by-page Mushaf reader (AI agent)

**Request (owner):** the app should behave like a real book with the Mushaf pages laid out exactly as printed, work offline, reopen on the last page read, and include simple reading and memorization tools (bookmarks and similar, no audio).

**What:**
- `scripts/build-mushaf.py` builds `assets/mushaf/*.json` from the KFGQPC docx (line and page breaks) and `hafsData_v2-0.json` (verse text, page, line, juz). All 6236 verses are validated against the KFGQPC page and line numbers. Surah metadata comes from `Quran.json`.
- New reader (`app/index.tsx` + `components/MushafPage.tsx`): 604 pages, 15 lines, an inverted horizontal pager (book direction), justified by laying out words in rows. This solves the old RTL justify problem.
- Screens: contents (surahs, juz, go to page, memorization progress), search, bookmarks, settings.
- Memorization mode, verse actions sheet (bookmark, memorize from here, copy, share), page bookmarks, "page memorized" tracking, themes, keep awake.
- `lib/store.tsx` persists last page, bookmarks, memorized pages and settings. The old `savedVerses` value is migrated.
- Native layout kept LTR (`allowRTL(false)`, one-time reset of an old `forceRTL`). `+html.tsx` no longer sets `dir="rtl"`.
- Removed the old `app/quran.tsx` and unused template components. Added `expo-keep-awake`.
- Tests: `lib/__tests__/quran-test.ts` (data integrity and Arabic helpers). `tsc` now has 0 errors (was 37).

**Verified:** in the web build with headless Chrome at a 390×844 phone size: pages 1, 2, 3, 50 and 604, light/sepia/dark, swiping, toolbar, verse long-press sheet, verse and page bookmarks, memorization mode, contents and juz jump, search and jump with highlight, and reopening on the last page after a reload.

**Not verified:** Android and iOS devices (no emulator on the agent VM).

**Next:** device testing; then the P1 items in `ROADMAP.md`.

---

## 2026-10-06 — Project handover, documentation (AI agent)

**What:** Read the whole codebase and wrote the project documentation. No app code was changed.
- Rewrote `README.md` to match the real state of the app (several advertised features — English translation, theme toggle, English search — are not implemented yet).
- Added `docs/ARCHITECTURE.md`, `docs/RTL_JUSTIFY.md`, `docs/ROADMAP.md`, this dev log, and `AGENTS.md` (long-term memory for AI agents).

**Findings:**
- The RTL justify problem has concrete causes in React Native itself: on Android `textAlign: "justify"` is mapped to absolute `Gravity.LEFT` (so the last line goes left), `forceRTL` swaps `left`/`right` and only applies after a reload, and `textAlign` on nested `Text` spans is ignored. Details and fix options in `docs/RTL_JUSTIFY.md`.
- Long-press actions use `ActionSheetIOS`, so they do not work on Android.
- "Continue reading" does not scroll to the saved verse (`verseCords` is never populated).
- Baseline: `tsc --noEmit` = 37 errors, `expo lint` = 0 errors / 10 warnings, `expo-doctor` = 4 packages behind SDK 51 patch versions.

**Next:** fix RTL justify (option A), make verse actions cross-platform, parse route params as numbers, fix "continue reading" scrolling.

---

## 2024-11-25 — Finalizing Quran page (Abdulmalik)
Commit `609e6ff`. Reader polishing: highlighted saved verse, lazy rendering with `renderCount`, red last verse, attempted scroll-to-verse; home "continue where you stopped" button using AsyncStorage + `useFocusEffect`.

## 2024-10-21 — Long press verse for options (Abdulmalik)
Commit `b21a6b3`. Long-press a verse to open an action sheet (save verse / copy verse) via `ActionSheetIOS`, `expo-clipboard`, AsyncStorage.

## 2024-10-20 — Small fixes (Abdulmalik)
Commit `0d784e4`. Reader switched from one joined string (`fullSurah.join("")`, `selectable`) to one nested `Text` per verse so each verse can receive press events. Tried `react-scroll-into-view` (web-only, unused).

## 2024-10-19 — Quran window (Abdulmalik)
Commit `39a0169`. Added the reader screen (`app/quran.tsx`), KFGQPC Uthmanic Hafs font and data, Basmalah image, new icon and splash, RTL in the root layout.

## 2024-10-11 — App init (Abdulmalik)
Commit `724dbf0`. Expo SDK 51 project from the Expo Router template, NativeWind/Tailwind setup, `assets/Quran.json`.
