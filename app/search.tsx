import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { arabicNumber, normalizeArabic } from "@/lib/arabic";
import { searchCorpus, surahs, verse, verseText } from "@/lib/quran";
import { useStore } from "@/lib/store";
import { QURAN_FONT } from "@/lib/theme";

const MAX_RESULTS = 200;

let normalizedCorpus: string[] | null = null;
function corpus(): string[] {
  if (!normalizedCorpus) normalizedCorpus = searchCorpus().map(normalizeArabic);
  return normalizedCorpus;
}

export default function Search() {
  const { colors, jumpTo } = useStore();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { results, total } = useMemo(() => {
    const q = normalizeArabic(debounced);
    if (q.length < 2) return { results: [] as number[], total: 0 };
    const found: number[] = [];
    let count = 0;
    corpus().forEach((text, i) => {
      if (text.includes(q)) {
        count++;
        if (found.length < MAX_RESULTS) found.push(i);
      }
    });
    return { results: found, total: count };
  }, [debounced]);

  return (
    <View style={[styles.root, { backgroundColor: colors.page }]}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        autoFocus
        placeholder="اكتب كلمة أو جزءاً من آية"
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
      />
      {debounced.trim().length >= 2 && (
        <Text style={[styles.count, { color: colors.muted }]}>
          {total === 0
            ? "لا توجد نتائج"
            : `${arabicNumber(total)} نتيجة${total > MAX_RESULTS ? ` (يظهر أول ${arabicNumber(MAX_RESULTS)})` : ""}`}
        </Text>
      )}
      <FlatList
        data={results}
        keyExtractor={String}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const v = verse(item);
          return (
            <Pressable
              onPress={() => {
                jumpTo(v.page, item);
                router.back();
              }}
              style={({ pressed }) => [
                styles.row,
                { borderColor: colors.border, backgroundColor: pressed ? colors.highlight : "transparent" },
              ]}
            >
              <Text style={[styles.ref, { color: colors.accent }]}>
                {`سورة ${surahs[v.surah - 1].name} - الآية ${arabicNumber(v.ayah)} – صفحة ${arabicNumber(v.page)}`}
              </Text>
              <Text style={[styles.verse, { color: colors.text }]} numberOfLines={3}>
                {verseText(item)}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  input: {
    margin: 12,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: "right",
  },
  count: { fontSize: 13, textAlign: "right", marginHorizontal: 14, marginBottom: 6 },
  row: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  ref: { fontSize: 13, fontWeight: "600", textAlign: "right" },
  verse: { fontFamily: QURAN_FONT, fontSize: 19, lineHeight: 36, textAlign: "right", writingDirection: "rtl" },
});
