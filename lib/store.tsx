import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";

import { PAGE_COUNT, verse, verseIndex } from "./quran";
import { Palette, ThemeName, themes } from "./theme";

export type Bookmark = {
  id: string;
  page: number;
  /** Global verse index when the bookmark is for a verse, otherwise the whole page. */
  verse?: number;
  createdAt: number;
};

export type Settings = {
  theme: ThemeName | "system";
  keepAwake: boolean;
  /** Memorization mode: keep the first word of every verse visible as a hint. */
  hintFirstWord: boolean;
};

const DEFAULT_SETTINGS: Settings = { theme: "system", keepAwake: true, hintFirstWord: false };

const KEYS = {
  lastPage: "huda:lastPage",
  bookmarks: "huda:bookmarks",
  memorized: "huda:memorized",
  settings: "huda:settings",
  legacySavedVerse: "savedVerses",
};

export type JumpRequest = { page: number; verse?: number; id: number };

type Store = {
  ready: boolean;
  lastPage: number;
  setLastPage: (page: number) => void;
  bookmarks: Bookmark[];
  toggleBookmark: (page: number, verse?: number) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (page: number, verse?: number) => boolean;
  memorized: Set<number>;
  togglePageMemorized: (page: number) => void;
  resetMemorized: () => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  colors: Palette;
  jump: JumpRequest | null;
  jumpTo: (page: number, verse?: number) => void;
};

const StoreContext = createContext<Store | null>(null);

const clampPage = (p: number) => Math.min(PAGE_COUNT, Math.max(1, Math.round(p) || 1));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [lastPage, setLastPageState] = useState(1);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [memorized, setMemorized] = useState<Set<number>>(new Set());
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [jump, setJump] = useState<JumpRequest | null>(null);
  const jumpId = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const entries: Record<string, string | null> = Object.fromEntries(
          await AsyncStorage.multiGet(Object.values(KEYS))
        );
        const read = (key: string) => entries[key] ?? null;
        const savedPage = read(KEYS.lastPage);
        let page = savedPage ? clampPage(Number(savedPage)) : 1;
        const savedMarks = read(KEYS.bookmarks);
        let marks: Bookmark[] = savedMarks ? JSON.parse(savedMarks) : [];

        // Earlier versions stored a single { surah, verse } (0-based) bookmark.
        const legacy = read(KEYS.legacySavedVerse);
        if (legacy && !savedPage) {
          const { surah, verse: ayah } = JSON.parse(legacy);
          const v = verse(verseIndex(Number(surah) + 1, Number(ayah) + 1));
          page = v.page;
          marks = [{ id: `v${v.index}`, page: v.page, verse: v.index, createdAt: Date.now() }];
        }

        setLastPageState(page);
        setBookmarks(marks);
        const savedMemorized = read(KEYS.memorized);
        if (savedMemorized) setMemorized(new Set(JSON.parse(savedMemorized)));
        const savedSettings = read(KEYS.settings);
        if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.warn("Could not load saved state", e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = (key: string, value: unknown) => {
    AsyncStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value)).catch((e) =>
      console.warn("Could not save", key, e)
    );
  };

  const setLastPage = useCallback((page: number) => {
    const p = clampPage(page);
    setLastPageState(p);
    persist(KEYS.lastPage, String(p));
  }, []);

  const bookmarkId = (page: number, v?: number) => (v === undefined ? `p${page}` : `v${v}`);

  const toggleBookmark = useCallback((page: number, v?: number) => {
    setBookmarks((prev) => {
      const id = bookmarkId(page, v);
      const next = prev.some((b) => b.id === id)
        ? prev.filter((b) => b.id !== id)
        : [{ id, page, verse: v, createdAt: Date.now() }, ...prev];
      persist(KEYS.bookmarks, next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      persist(KEYS.bookmarks, next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (page: number, v?: number) => bookmarks.some((b) => b.id === bookmarkId(page, v)),
    [bookmarks]
  );

  const togglePageMemorized = useCallback((page: number) => {
    setMemorized((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      persist(KEYS.memorized, [...next]);
      return next;
    });
  }, []);

  const resetMemorized = useCallback(() => {
    setMemorized(new Set());
    persist(KEYS.memorized, []);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persist(KEYS.settings, next);
      return next;
    });
  }, []);

  const jumpTo = useCallback(
    (page: number, v?: number) => {
      jumpId.current += 1;
      setJump({ page: clampPage(page), verse: v, id: jumpId.current });
    },
    []
  );

  const themeName: ThemeName = settings.theme === "system" ? (scheme === "dark" ? "dark" : "light") : settings.theme;

  const value = useMemo<Store>(
    () => ({
      ready,
      lastPage,
      setLastPage,
      bookmarks,
      toggleBookmark,
      removeBookmark,
      isBookmarked,
      memorized,
      togglePageMemorized,
      resetMemorized,
      settings,
      updateSettings,
      colors: themes[themeName],
      jump,
      jumpTo,
    }),
    [
      ready,
      lastPage,
      setLastPage,
      bookmarks,
      toggleBookmark,
      removeBookmark,
      isBookmarked,
      memorized,
      togglePageMemorized,
      resetMemorized,
      settings,
      updateSettings,
      themeName,
      jump,
      jumpTo,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
