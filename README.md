# Huda Al-Quran (هدى القرآن)

**Huda Al-Quran** is a simple, lightweight, fully offline Quran reader for **Android and iOS**, built with React Native and Expo. The app is a charitable endowment (وقف لله تعالى) and focuses on a clean, distraction-free reading experience in the Uthmani script.

> Status: early development. The core reading flow works; see [Current state](#current-state) and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what is done and what is planned.

## Current state

| Feature | Status |
| --- | --- |
| Full Quran text (Arabic, Uthmani script, 114 surahs / 6236 verses) bundled offline | Done |
| Surah list with search by Arabic name | Done |
| Surah reading screen (continuous text, Arabic-Indic verse numbers, Basmalah image) | Done |
| Long-press a verse: bookmark ("حفظ الآية") or copy ("نسخ الآية") | iOS only (uses `ActionSheetIOS`) |
| "Continue where you stopped" button (single bookmark in AsyncStorage) | Partial: opens the surah but does not scroll to the verse |
| Right-to-left **justified** text in the reader | **Broken / open issue** — see [`docs/RTL_JUSTIFY.md`](docs/RTL_JUSTIFY.md) |
| Dark theme | Forced dark (no toggle yet) |
| English translation, English search, light/dark toggle | Planned (data for English is already in `assets/Quran.json`) |

## Technology stack

- **React Native 0.74** + **Expo SDK 51** (managed workflow)
- **Expo Router 3** (file-based navigation, `app/` directory)
- **NativeWind 2** (Tailwind `className` styling) with Tailwind CSS 3
- **AsyncStorage** for the saved verse (bookmark)
- **expo-clipboard** for copying verses
- **KFGQPC Uthmanic Hafs** font (`assets/fonts/Othmani.ttf`, registered as `othmani-1`)

## Getting started

Requirements: Node.js 18+ and npm. To run on a device, install **Expo Go** (SDK 51) or use an Android emulator / iOS simulator.

```bash
git clone https://github.com/Abdulmalik1321/Huda-Al-Quran.git
cd Huda-Al-Quran
npm install
npx expo start        # then press "a" for Android, "i" for iOS, or scan the QR code
```

Other scripts:

```bash
npm run android      # expo start --android
npm run ios          # expo start --ios
npm run lint         # expo lint (first run installs eslint + eslint-config-expo)
npm test             # jest (watch mode)
npx tsc --noEmit     # type check (currently reports errors, see docs/ROADMAP.md)
```

Note: `I18nManager.forceRTL(true)` only takes effect after the app is fully reloaded, so the first launch after install may render left-to-right.

## Project structure

```
app/
  _layout.tsx     Root stack navigator, dark theme, forces RTL
  index.tsx       Home: Basmalah, "continue reading" button, surah search + list
  quran.tsx       Reader: renders one surah as justified Arabic text, long-press actions
  +html.tsx       Web-only HTML shell (dir="rtl", lang="ar")
  +not-found.tsx  404 screen (Expo template)
assets/
  Quran.json      The Quran data used by the app (Arabic + English per verse)
  fonts/          Othmani.ttf (used), KFGQPC Hafs reference data in fonts/Othmani/
  images/         Basmalah.png, icon, splash
components/, hooks/, constants/   Mostly unused Expo template leftovers
docs/             Architecture, RTL/justify investigation, roadmap, dev log
AGENTS.md         Project memory / conventions for AI coding agents
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for details on the data format and screens.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the app is put together, data model, navigation
- [`docs/RTL_JUSTIFY.md`](docs/RTL_JUSTIFY.md) — analysis of the right-to-left justified text problem and the fix options
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — known bugs, technical debt, and planned features
- [`docs/DEVLOG.md`](docs/DEVLOG.md) — chronological development log
- [`AGENTS.md`](AGENTS.md) — long-term memory and working rules for AI agents on this repo

## Contributing

1. Fork the repository.
2. Create a branch for your feature or fix: `git checkout -b my-feature`.
3. Commit your changes with a meaningful message and add an entry to `docs/DEVLOG.md`.
4. Push and open a pull request.

## Data and font credits

The Uthmanic Hafs font and reference data (`assets/fonts/Othmani/`) are published by the King Fahd Glorious Quran Printing Complex (KFGQPC), version 2.0.
