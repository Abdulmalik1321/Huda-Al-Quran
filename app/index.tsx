import Ionicons from "@expo/vector-icons/Ionicons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MemorizeState, MushafPage, pageMetrics } from "@/components/MushafPage";
import { VerseActions } from "@/components/VerseActions";
import { arabicNumber } from "@/lib/arabic";
import { PAGE_COUNT, pageInfo, pageLayout, PageWord, surahs } from "@/lib/quran";
import { useStore } from "@/lib/store";

const PAGES = Array.from({ length: PAGE_COUNT }, (_, i) => i + 1);
const KEEP_AWAKE_TAG = "reader";
const MEMORIZE_BAR_HEIGHT = 64;

export default function Reader() {
  const store = useStore();
  const { colors, settings, jump, setLastPage, isBookmarked, memorized } = store;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const listRef = useRef<FlatList<number>>(null);
  const [page, setPage] = useState(store.lastPage);
  const [chrome, setChrome] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [memorizing, setMemorizing] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, number>>({});
  const [actionVerse, setActionVerse] = useState<number | null>(null);

  // While memorizing, the controls stay on screen, so the page shrinks to end above them.
  const bottomSpace = insets.bottom + (memorizing ? MEMORIZE_BAR_HEIGHT : 0);
  const metrics = useMemo(
    () => pageMetrics(width, height, insets.top, bottomSpace),
    [width, height, insets.top, bottomSpace]
  );

  useEffect(() => {
    if (settings.keepAwake) activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    else deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [settings.keepAwake]);

  useEffect(() => {
    if (!jump) return;
    listRef.current?.scrollToIndex({ index: jump.page - 1, animated: false });
    setPage(jump.page);
    setLastPage(jump.page);
    setHighlight(jump.verse ?? null);
    setChrome(false);
  }, [jump, setLastPage]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const visible = viewableItems.find((v) => v.isViewable);
    if (!visible) return;
    const p = visible.item as number;
    setPage(p);
    setLastPage(p);
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  useEffect(() => {
    const { firstVerse, lastVerse } = pageInfo[page - 1];
    setHighlight((h) => (h !== null && (h < firstVerse || h > lastVerse) ? null : h));
  }, [page]);

  const words = pageLayout(page).words;
  const revealedHere = revealed[page] ?? 0;
  const setRevealedHere = useCallback(
    (n: number) => setRevealed((r) => ({ ...r, [page]: Math.max(0, Math.min(n, pageLayout(page).words.length)) })),
    [page]
  );

  const revealNextWord = () => {
    let n = revealedHere;
    while (n < words.length && words[n].isMark) n++;
    setRevealedHere(n + 1);
  };
  const revealNextVerse = () => {
    let n = revealedHere;
    while (n < words.length && !words[n].isMark) n++;
    setRevealedHere(n + 1);
  };

  const onWordPress = useCallback(
    (w: PageWord) => {
      if (memorizing) {
        setRevealed((r) => ({ ...r, [page]: Math.max(r[page] ?? 0, w.index + 1) }));
      } else {
        setHighlight(null);
        setChrome((c) => !c);
      }
    },
    [memorizing, page]
  );

  const onPagePress = useCallback(() => {
    setHighlight(null);
    setChrome((c) => !c);
  }, []);

  const onVerseLongPress = useCallback((v: number) => {
    setHighlight(v);
    setActionVerse(v);
  }, []);

  const memorizeFrom = (v: number) => {
    const start = words.findIndex((w) => w.verse === v);
    setMemorizing(true);
    setHighlight(null);
    setRevealedHere(start < 0 ? 0 : start);
  };

  const inactiveMemorize = useMemo<MemorizeState>(
    () => ({ active: memorizing, revealed: 0, hintFirstWord: settings.hintFirstWord }),
    [memorizing, settings.hintFirstWord]
  );

  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <MushafPage
        page={item}
        metrics={metrics}
        insetTop={insets.top}
        insetBottom={bottomSpace}
        colors={colors}
        highlightVerse={item === page ? highlight : null}
        memorize={
          item === page || memorizing
            ? { active: memorizing, revealed: revealed[item] ?? 0, hintFirstWord: settings.hintFirstWord }
            : inactiveMemorize
        }
        bookmarked={isBookmarked(item)}
        memorized={memorized.has(item)}
        onPress={onPagePress}
        onWordPress={onWordPress}
        onVerseLongPress={onVerseLongPress}
      />
    ),
    [
      metrics,
      insets.top,
      bottomSpace,
      colors,
      page,
      highlight,
      memorizing,
      revealed,
      settings.hintFirstWord,
      inactiveMemorize,
      isBookmarked,
      memorized,
      onPagePress,
      onWordPress,
      onVerseLongPress,
    ]
  );

  const info = pageInfo[page - 1];
  const pageBookmarked = isBookmarked(page);
  const pageMemorized = memorized.has(page);

  return (
    <View style={[styles.root, { backgroundColor: colors.page }]}>
      <StatusBar style={colors.statusBar} />
      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={String}
        renderItem={renderItem}
        extraData={renderItem}
        horizontal
        inverted
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={store.lastPage - 1}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {chrome && (
        <>
          <View style={[styles.topBar, { paddingTop: insets.top + 6, backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.barRow}>
              <BarButton icon="list" label="الفهرس" color={colors.accent} onPress={() => router.push("/contents")} />
              <BarButton icon="search" label="بحث" color={colors.accent} onPress={() => router.push("/search")} />
              <View style={styles.titleBox}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {info.surahs.map((s) => surahs[s - 1].name).join(" - ")}
                </Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  {`الجزء ${arabicNumber(info.juz)} – صفحة ${arabicNumber(page)}`}
                </Text>
              </View>
              <BarButton icon="bookmarks-outline" label="العلامات" color={colors.accent} onPress={() => router.push("/bookmarks")} />
              <BarButton icon="settings-outline" label="الإعدادات" color={colors.accent} onPress={() => router.push("/settings")} />
            </View>
          </View>
          {!memorizing && (
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8, backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.barRow}>
                <BarButton
                  icon={pageBookmarked ? "bookmark" : "bookmark-outline"}
                  label={pageBookmarked ? "إزالة العلامة" : "علامة الصفحة"}
                  color={colors.marker}
                  onPress={() => store.toggleBookmark(page)}
                />
                <BarButton
                  icon="eye-off-outline"
                  label="وضع التسميع"
                  color={colors.accent}
                  onPress={() => {
                    setMemorizing(true);
                    setChrome(false);
                  }}
                />
                <BarButton
                  icon={pageMemorized ? "checkmark-circle" : "checkmark-circle-outline"}
                  label={pageMemorized ? "محفوظة" : "حفظت الصفحة"}
                  color={colors.accent}
                  onPress={() => store.togglePageMemorized(page)}
                />
              </View>
            </View>
          )}
        </>
      )}

      {memorizing && (
        <View
          style={[
            styles.bottomBar,
            { height: bottomSpace, paddingBottom: insets.bottom, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.barRow}>
            <BarButton icon="text-outline" label="كلمة" color={colors.accent} onPress={revealNextWord} />
            <BarButton icon="reader-outline" label="آية" color={colors.accent} onPress={revealNextVerse} />
            <BarButton icon="eye-off-outline" label="إخفاء" color={colors.accent} onPress={() => setRevealedHere(0)} />
            <BarButton icon="eye-outline" label="إظهار" color={colors.accent} onPress={() => setRevealedHere(words.length)} />
            <BarButton
              icon="close-circle-outline"
              label="إنهاء"
              color={colors.marker}
              onPress={() => {
                setMemorizing(false);
                setRevealed({});
              }}
            />
          </View>
        </View>
      )}

      <VerseActions
        verseIndex={actionVerse}
        page={page}
        onClose={() => setActionVerse(null)}
        onMemorizeFrom={memorizeFrom}
      />
    </View>
  );
}

function BarButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.barButton, pressed && { opacity: 0.5 }]} hitSlop={6}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.barLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  barRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-around" },
  barButton: { alignItems: "center", minWidth: 56, paddingVertical: 4 },
  barLabel: { fontSize: 11, marginTop: 2 },
  titleBox: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  title: { fontSize: 17, fontWeight: "600" },
  subtitle: { fontSize: 12, marginTop: 2 },
});
