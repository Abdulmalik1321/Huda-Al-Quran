# Roadmap, known issues and technical debt

Priorities: **P0** blocks a usable release, **P1** important, **P2** nice to have.

## Known bugs

| Pri | Area | Issue |
| --- | --- | --- |
| P0 | Reader | Right-to-left justified text is wrong (alignment/direction). Full analysis in `RTL_JUSTIFY.md`. |
| P0 | Reader (Android) | Long-press uses `ActionSheetIOS`, which does not exist on Android, so save/copy fails there. Needs a cross-platform sheet (e.g. `@expo/react-native-action-sheet`, a modal, or `Alert`). |
| P1 | Reader | "Continue reading" does not scroll to the saved verse: `verseCords` is never filled (`setVerseCords` unused) and the scroll target is hard-coded to `verseCords[40]`. Instead, verses before the saved one are simply not rendered. |
| P1 | Reader | `useState(50 + verse)` concatenates strings because route params are strings (`verse = "3"` gives `"503"`). Parse params with `Number()` once at the top. |
| P1 | Reader | The Basmalah image is shown for every surah when starting at verse 0, including Al-Fatiha (where the Basmalah is already verse 1, so it appears twice) and At-Tawbah (which has no Basmalah). |
| P1 | Reader | `console.log` runs for every verse on every render (slow on long surahs). |
| P1 | Fonts | `othmani-1` is loaded in `index.tsx` without waiting for it; the root layout only waits for `SpaceMono`. Load the Quran font in `_layout.tsx` before hiding the splash. |
| P1 | RTL | `forceRTL` only applies after a reload; `text-right` becomes left once RTL is active. See `RTL_JUSTIFY.md`. |
| P2 | Home | Search only matches the Arabic `name`; README promised English search. |
| P2 | Home | Bookmark button label shows `{...}` braces literally (maybe intended as ﴿ ﴾ ornate brackets); only a single bookmark is stored. |
| P2 | Reader | Skipped verses render empty fragments without keys (React key warnings). |

## Technical debt

- `npx tsc --noEmit` reports **37 errors** (14 in `app/index.tsx`, 23 in `app/quran.tsx`): missing NativeWind types for `className` (add `nativewind-env.d.ts` with `/// <reference types="nativewind/types" />`), untyped `useRef(null)`/`useState(null)`, string route params used as numbers/indexes, `delayLongPress` on `Text`.
- `npm run lint` passes with 10 warnings (unused vars, `==`, hook deps). The first run auto-installs `eslint` + `eslint-config-expo` and creates `.eslintrc.js` — commit those when lint is adopted.
- `expo-doctor`: `expo`, `expo-router`, `expo-splash-screen`, `expo-updates` are behind the SDK 51 patch versions (`npx expo install --check`). Expo SDK 51 is old; plan an SDK upgrade before store release (newer Expo Go builds will not open SDK 51 projects).
- Unused dependencies: `react-native-fs` (not usable in Expo Go), `react-scroll-into-view` (web-only), `expo-file-system`, `@react-navigation/native-stack`.
- Repo bloat: `assets/ChatGPT.html` + `assets/ChatGPT_files/` (saved chat), `assets/fonts/Othmani.zip` (10 MB), `Othmani-old.ttf`, template images/components, `assets/SavedVerses.json`.
- `assets/Quran.json` (6 MB, with BOM) is imported in two screens and loaded into the JS bundle at startup. Consider a slimmer Arabic-only file, or lazy loading per surah.
- `app.json`: `scheme` is still `myapp`; no `ios.bundleIdentifier` / `android.package`; splash background is white while the app is dark-only; `userInterfaceStyle` is `automatic` but the theme is forced dark.
- Unit tests: only the Expo template snapshot test exists.

## Planned features

1. **Fix RTL justify** (P0) — option A from `RTL_JUSTIFY.md`.
2. **Cross-platform verse actions** (P0) — save, copy, share.
3. **Reliable "continue reading"** (P1) — scroll to the exact verse, keep surrounding context.
4. **Multiple bookmarks / reading history** (P1).
5. **Mushaf page mode** (P1) — 604 pages, 15 lines, juz/hizb navigation, using KFGQPC/QUL line data.
6. **Search** (P1) — surah by Arabic/English/number, and verse text search using `aya_text_emlaey` (diacritic-free).
7. **English translation toggle** (P2) — data already in `Quran.json` (`en` per verse).
8. **Light/dark theme toggle, font size setting** (P2).
9. **Audio recitation** (P2) — `Quran.json` has per-verse audio paths but no files or host.
10. **Release** — app icons, store metadata, EAS Build config (`eas.json`), bundle IDs.
