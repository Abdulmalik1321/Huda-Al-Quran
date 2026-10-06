# Huda Al-Quran (هدى القرآن)

**Huda Al-Quran** is a simple, fully offline Mushaf for **Android and iOS**, built with React Native and Expo. It shows the 604 pages of the Madinah Mushaf exactly as printed (same pages, same 15 lines), you turn pages like a real book, and it always reopens on the last page you read. The app is a charitable endowment (وقف لله تعالى).

## Features

- **Real Mushaf pages**: the KFGQPC Uthmanic Hafs layout, with surah title frames, Basmalah, verse-end markers, juz and page numbers. Swipe to turn pages right to left.
- **Reopens on your last page** every time.
- **Contents (الفهرس)**: surahs and juz, go to any page number, search surah names (Arabic, English or number).
- **Bookmarks (العلامات)**: bookmark a page or a single verse. Saved locally and listed with a preview.
- **Search (البحث)**: find verses by any word, ignoring diacritics, and jump to the page with the verse highlighted.
- **Verse actions**: long-press a verse to bookmark, copy, share, or start memorizing from it.
- **Memorization mode (وضع التسميع)**: hides the words of the page. Tap a word to reveal up to it, or reveal word by word or verse by verse. An optional hint keeps the first word of each verse visible.
- **Memorization progress**: mark pages as memorized and track progress per surah and overall.
- **Themes**: light, sepia (paper) or night, or follow the system. The screen stays awake while reading (optional).
- 100% offline: no network, no accounts, no audio.

## Technology

- **React Native 0.74** + **Expo SDK 51**, **Expo Router 3**
- **AsyncStorage** for last page, bookmarks, memorization progress and settings
- **KFGQPC Uthmanic Hafs v2.0** font and data (`assets/fonts/Othmani/`), compiled into `assets/mushaf/*.json` by `scripts/build-mushaf.py`

## Getting started

Requirements: Node.js 18+ and npm. On a phone, use **Expo Go for SDK 51**, or an Android emulator / iOS simulator.

```bash
git clone https://github.com/Abdulmalik1321/Huda-Al-Quran.git
cd Huda-Al-Quran
npm install
npx expo start        # press "a" for Android, "i" for iOS, "w" for web, or scan the QR code
```

Other commands:

```bash
npx jest --ci        # tests (data integrity + helpers)
npx tsc --noEmit     # type check
```

Rebuilding the Mushaf data (only needed if the KFGQPC sources or the build script change):

```bash
pip install uharfbuzz
python3 scripts/build-mushaf.py
```

## Project structure

```
app/
  _layout.tsx     Root stack; loads the font and saved state before hiding the splash
  index.tsx       The Mushaf reader (opens on the last page)
  contents.tsx    Surahs / juz / go to page / memorization progress
  search.tsx      Verse search
  bookmarks.tsx   Bookmarks list
  settings.tsx    Theme, keep awake, memorization hint, help
components/
  MushafPage.tsx  Renders one Mushaf page
  VerseActions.tsx  Long-press sheet for a verse
lib/
  quran.ts        Mushaf data access
  store.tsx       Persistent app state
  theme.ts, arabic.ts
assets/mushaf/    Generated page, verse, text and search data
scripts/build-mushaf.py  Builds assets/mushaf from the KFGQPC files
docs/             Architecture, roadmap, dev log, RTL notes
AGENTS.md         Project memory for AI coding agents
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): data pipeline, page rendering, reader, state
- [`docs/ROADMAP.md`](docs/ROADMAP.md): done, to verify, planned simple features, technical debt
- [`docs/DEVLOG.md`](docs/DEVLOG.md): development log
- [`docs/RTL_JUSTIFY.md`](docs/RTL_JUSTIFY.md): why the old justified-text reader failed, and how the page layout solves it
- [`AGENTS.md`](AGENTS.md): long-term memory and working rules for AI agents

## Contributing

1. Fork the repository and create a branch: `git checkout -b my-feature`.
2. Make your change, run `npx jest --ci` and `npx tsc --noEmit`, and add an entry to `docs/DEVLOG.md`.
3. Push and open a pull request.

## Credits

The Mushaf text, layout and font are from the King Fahd Glorious Quran Printing Complex (KFGQPC), Uthmanic Hafs version 2.0.
