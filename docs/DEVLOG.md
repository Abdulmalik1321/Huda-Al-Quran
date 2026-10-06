# Development log

Newest entries first. Add an entry for every meaningful change: date, who, what changed, why, and what is next.

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
