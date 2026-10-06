# AGENTS.md — long-term memory for AI agents

Read this first in every session. Keep it short and current: update it whenever you learn something that a future session would otherwise have to rediscover. Log the work itself in `docs/DEVLOG.md`.

## Project in one paragraph
Huda Al-Quran (هدى القرآن): an offline Quran reader for Android and iOS, built with Expo SDK 51, React Native 0.74, Expo Router 3, NativeWind 2. Owner: Abdulmalik Almasud (GitHub `Abdulmalik1321`). The app is a charitable endowment (وقف). Arabic-first, dark theme, Uthmani script with the KFGQPC Hafs font.

## Where things are
- `app/_layout.tsx` stack + `I18nManager.forceRTL(true)`; `app/index.tsx` home/surah list; `app/quran.tsx` reader.
- `assets/Quran.json` — the data the app uses (UTF-8 **with BOM**; use `encoding='utf-8-sig'` in Python). 114 surahs, `surah.array[i].ar` / `.en`, index = number − 1.
- `assets/fonts/Othmani.ttf` registered as font family `othmani-1` (Tailwind: `font-[othmani-1]`).
- `assets/fonts/Othmani/UthmanicHafs_v2-0 data/hafsData_v2-0.json` — KFGQPC data with `page` (1–604), `line_start`/`line_end` (1–15), `jozz`, `aya_text_emlaey` (plain text for search). Not used yet.
- AsyncStorage key `savedVerses` = `{ surah, verse }`, both 0-based.
- Docs: `docs/ARCHITECTURE.md`, `docs/RTL_JUSTIFY.md`, `docs/ROADMAP.md`, `docs/DEVLOG.md`.

## Main open problem
RTL + justified text in the reader is broken. Root causes (from RN 0.74 source): Android maps `justify` to absolute `Gravity.LEFT`; `forceRTL` flips `left`/`right` and needs a reload; `textAlign` on nested `Text` is ignored; `writingDirection` is iOS-only (use a leading `\u200F` on Android). Fix plan and options A/B/C are in `docs/RTL_JUSTIFY.md`. Do not claim it is fixed without testing on both an Android 8+ device/emulator and iOS.

## Gotchas
- Expo Router params are strings: convert with `Number()` before arithmetic (`50 + verse` is string concatenation today).
- `ActionSheetIOS` does not exist on Android.
- Under RTL, `text-right` means "start", i.e. it renders on the left once RTL is active.
- `npm run lint` / `npx expo lint` auto-installs eslint and edits `package.json` + creates `.eslintrc.js` on first run. Revert if lint adoption was not requested.
- Baseline (2026-10-06): `npx tsc --noEmit` = 37 errors, lint = 10 warnings, `expo-doctor` = 4 outdated patch versions. Do not make these worse.
- `assets/ChatGPT.html` is a saved chat, not an asset. `Othmani.zip` is 10 MB of duplicate font data.
- The cloud VM has no Android/iOS emulator by default; device testing must be done by the owner or with Expo Go.

## Conventions
- UI strings are Arabic. Verse numbers use Arabic-Indic digits (`convertToArabicNumerals`).
- Styling with NativeWind `className`; inline `style` for things NativeWind 2 does not cover (e.g. `lineHeight`, `tintColor`).
- Base branch for PRs: `AI-dev`. Agent branches: `cursor/<name>-17c7`. One logical change per commit.
- Every change: add a `docs/DEVLOG.md` entry; update `docs/ROADMAP.md` when a known issue is fixed or found; update this file when a fact here changes.

## Current priorities
1. Fix RTL justify in the reader (option A in `docs/RTL_JUSTIFY.md`).
2. Cross-platform long-press actions (save/copy).
3. Parse route params as numbers; make "continue reading" scroll to the verse.
4. Load the Quran font before hiding the splash; fix Basmalah for Al-Fatiha and At-Tawbah.
