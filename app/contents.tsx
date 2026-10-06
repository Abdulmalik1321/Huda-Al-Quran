import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { arabicNumber, normalizeArabic, parseNumber } from "@/lib/arabic";
import { juzList, PAGE_COUNT, pageInfo, surahPages, surahs, verse, verseIndex } from "@/lib/quran";
import { useStore } from "@/lib/store";
import { Palette } from "@/lib/theme";

type Tab = "surahs" | "juz";

export default function Contents() {
  const { colors, jumpTo, memorized, lastPage } = useStore();
  const [tab, setTab] = useState<Tab>("surahs");
  const [query, setQuery] = useState("");
  const [pageInput, setPageInput] = useState("");

  const open = (page: number) => {
    jumpTo(page);
    router.back();
  };

  const filteredSurahs = useMemo(() => {
    const q = normalizeArabic(query);
    if (!q) return surahs;
    const n = parseNumber(q);
    return surahs.filter(
      (s) => normalizeArabic(s.name).includes(q) || s.en.toLowerCase().includes(q) || s.n === n
    );
  }, [query]);

  const surahProgress = useMemo(
    () =>
      surahs.map((s) => {
        const [start, end] = surahPages(s.n);
        let done = 0;
        for (let p = start; p <= end; p++) if (memorized.has(p)) done++;
        return done / (end - start + 1);
      }),
    [memorized]
  );

  const percent = Math.round((memorized.size / PAGE_COUNT) * 100);
  const goToPage = () => {
    const p = parseNumber(pageInput);
    if (p >= 1 && p <= PAGE_COUNT) open(p);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.page }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{`تقدم الحفظ: ${arabicNumber(percent)}٪`}</Text>
        <Text style={[styles.cardSub, { color: colors.muted }]}>
          {`${arabicNumber(memorized.size)} من ${arabicNumber(PAGE_COUNT)} صفحة – آخر صفحة قرأتها ${arabicNumber(lastPage)}`}
        </Text>
        <ProgressBar value={memorized.size / PAGE_COUNT} colors={colors} />
        <View style={styles.goRow}>
          <TextInput
            value={pageInput}
            onChangeText={setPageInput}
            onSubmitEditing={goToPage}
            placeholder="رقم الصفحة"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            returnKeyType="go"
            style={[styles.input, styles.pageInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.page }]}
          />
          <Pressable onPress={goToPage} style={[styles.goButton, { backgroundColor: colors.accent }]}>
            <Text style={styles.goText}>اذهب</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.tabs, { borderColor: colors.border }]}>
        {(["surahs", "juz"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.tabText, { color: tab === t ? "#fff" : colors.text }]}>
              {t === "surahs" ? "السور" : "الأجزاء"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "surahs" ? (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث عن سورة بالاسم أو الرقم"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.search, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          />
          <FlatList
            data={filteredSurahs}
            keyExtractor={(s) => String(s.n)}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            renderItem={({ item: s }) => (
              <Row
                colors={colors}
                number={s.n}
                title={`سورة ${s.name}`}
                subtitle={`${s.type} – ${arabicNumber(s.ayahs)} آية – ${s.en}`}
                page={s.page}
                progress={surahProgress[s.n - 1]}
                active={pageInfo[lastPage - 1].surahs.includes(s.n)}
                onPress={() => open(s.page)}
              />
            )}
          />
        </>
      ) : (
        <FlatList
          data={juzList}
          keyExtractor={(j) => String(j.juz)}
          renderItem={({ item: j }) => {
            const start = verse(verseIndex(j.s, j.a));
            return (
              <Row
                colors={colors}
                number={j.juz}
                title={`الجزء ${arabicNumber(j.juz)}`}
                subtitle={`يبدأ من سورة ${surahs[j.s - 1].name} آية ${arabicNumber(j.a)}`}
                page={start.page}
                active={pageInfo[lastPage - 1].juz === j.juz}
                onPress={() => open(start.page)}
              />
            );
          }}
        />
      )}
    </View>
  );
}

function Row({
  colors,
  number,
  title,
  subtitle,
  page,
  progress,
  active,
  onPress,
}: {
  colors: Palette;
  number: number;
  title: string;
  subtitle: string;
  page: number;
  progress?: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: colors.border, backgroundColor: pressed || active ? colors.highlight : "transparent" },
      ]}
    >
      <View style={[styles.badge, { borderColor: colors.marker }]}>
        <Text style={[styles.badgeText, { color: colors.marker }]}>{arabicNumber(number)}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: colors.muted }]} numberOfLines={1}>
          {subtitle}
        </Text>
        {progress !== undefined && progress > 0 && <ProgressBar value={progress} colors={colors} thin />}
      </View>
      <Text style={[styles.rowPage, { color: colors.muted }]}>{arabicNumber(page)}</Text>
    </Pressable>
  );
}

function ProgressBar({ value, colors, thin }: { value: number; colors: Palette; thin?: boolean }) {
  return (
    <View style={[styles.bar, { backgroundColor: colors.mask, height: thin ? 3 : 6 }]}>
      <View style={[styles.barFill, { backgroundColor: colors.accent, width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { margin: 12, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  cardTitle: { fontSize: 17, fontWeight: "600", textAlign: "right" },
  cardSub: { fontSize: 13, textAlign: "right", marginTop: 4, marginBottom: 8 },
  goRow: { flexDirection: "row-reverse", marginTop: 12, gap: 8 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, fontSize: 15, textAlign: "right" },
  pageInput: { flex: 1, height: 42 },
  goButton: { paddingHorizontal: 18, borderRadius: 10, justifyContent: "center" },
  goText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  tabs: {
    flexDirection: "row-reverse",
    marginHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center" },
  tabText: { fontSize: 15, fontWeight: "600" },
  search: { marginHorizontal: 12, marginTop: 10, marginBottom: 4, height: 42, flexShrink: 0 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  badge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 13, fontWeight: "600" },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600", textAlign: "right" },
  rowSub: { fontSize: 12, textAlign: "right", marginTop: 2 },
  rowPage: { fontSize: 13, minWidth: 30, textAlign: "left" },
  bar: { borderRadius: 3, overflow: "hidden", marginTop: 6 },
  barFill: { height: "100%" },
});
