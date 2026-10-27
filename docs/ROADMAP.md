# Roadmap, known issues and technical debt

Scope set by the owner (2026-10-06): an offline Mushaf that behaves like a real book and reopens on the last page read, plus **simple** tools for reading and memorizing. No audio or other large features.

Priorities: **P0** blocks a usable release, **P1** important, **P2** nice to have.

## Done (v2 Mushaf reader)

- 604-page Madinah Mushaf with the exact KFGQPC page and line layout, swiped like a book
- Reopens on the last page read
- Surah and juz contents, go to page, current surah/juz highlighted
- Page and verse bookmarks
- Verse long-press: bookmark, copy, share, memorize from here (works on Android, iOS and web)
- Verse search, diacritic-insensitive
- Memorization mode (hide words, reveal by tap, word or verse) with an optional first-word hint
- Mark pages as memorized, progress per surah and overall
- Light, sepia and dark themes (or follow system), keep screen awake
- Migration of the old single saved verse

## To verify on devices (P0)

- Android 8+ and iOS (Expo Go SDK 51): page swipe direction, `initialScrollIndex` landing on the right page, long-press timing, word masks, font rendering of the verse-end glyphs (U+FC00…), and the one-time reload that resets an old `forceRTL(true)`.
- Performance of page swipes on low-end Android (each page has about 150 `Pressable`s). If it is slow, render each line as one `Text` with nested spans and keep only the `View` rows for justification.
- Small phones (width ≤ 360 dp): the base font gets small (about 18 px). Consider an optional "large text" mode that scrolls inside a page.

## Planned simple features (P1–P2)

| Pri | Feature | Notes |
| --- | --- | --- |
| P1 | Juz / hizb markers | `۞` is already in the text; show the hizb/quarter name in the page header. Needs quarter data (not in hafsData). |
| P1 | Reading goal / khatma tracker | Daily pages target, streak, "pages read today". Uses `lastPage` changes. |
| P1 | Memorization review list | Pages marked memorized, sorted by when they were last reviewed, with a "reviewed today" action. |
| P2 | Notes on a verse | Short personal note per verse, stored next to bookmarks. |
| P2 | Bookmark colors / names | Several reading positions (e.g. one per family member). |
| P2 | Two-page spread on tablets / landscape | Two `MushafPage`s side by side. |
| P2 | Sajdah marker | Show a sajdah indicator on lines containing `۩`. |

## Technical debt

- `npx expo lint` is not set up (the first run installs eslint + `eslint-config-expo` and creates `.eslintrc.js`).
- `expo-doctor`: `expo`, `expo-router`, `expo-splash-screen`, `expo-updates` are behind the SDK 51 patch versions (`npx expo install --check`). Expo SDK 51 is old; plan an SDK upgrade before a store release, because current Expo Go builds may not open SDK 51 projects.
- Unused dependencies: `nativewind` / `tailwindcss` (no app code uses `className` any more), `react-native-fs`, `react-scroll-into-view`, `expo-file-system`, `@react-navigation/native-stack`.
- Repo size: `assets/ChatGPT.html` + `assets/ChatGPT_files/`, `assets/fonts/Othmani.zip` (10 MB), `Othmani-old.ttf`, template images/components, `assets/SavedVerses.json`. `assets/Quran.json` (6 MB) is now only used by the build script.
- `app.json`: no `ios.bundleIdentifier` / `android.package`, no `eas.json`; the icon and splash are still placeholders.
