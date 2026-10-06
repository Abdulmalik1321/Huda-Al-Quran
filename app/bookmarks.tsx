import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { arabicNumber } from "@/lib/arabic";
import { pageInfo, surahs, verse, verseText } from "@/lib/quran";
import { Bookmark, useStore } from "@/lib/store";
import { QURAN_FONT } from "@/lib/theme";

function describe(b: Bookmark): { title: string; snippet?: string } {
  if (b.verse !== undefined) {
    const v = verse(b.verse);
    const words = verseText(b.verse).split(" ");
    return {
      title: `سورة ${surahs[v.surah - 1].name} - الآية ${arabicNumber(v.ayah)}`,
      snippet: words.slice(0, 8).join(" ") + (words.length > 8 ? " …" : ""),
    };
  }
  const info = pageInfo[b.page - 1];
  return { title: `صفحة ${arabicNumber(b.page)} - سورة ${surahs[info.surahs[0] - 1].name}` };
}

export default function Bookmarks() {
  const { colors, bookmarks, removeBookmark, jumpTo } = useStore();

  if (bookmarks.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.page }]}>
        <Ionicons name="bookmarks-outline" size={48} color={colors.muted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>لا توجد علامات بعد</Text>
        <Text style={[styles.emptyText, { color: colors.muted }]}>
          اضغط على الصفحة ثم «علامة الصفحة»، أو اضغط مطولاً على أي آية لوضع علامة عليها.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.page }}
      data={bookmarks}
      keyExtractor={(b) => b.id}
      renderItem={({ item }) => {
        const { title, snippet } = describe(item);
        return (
          <Pressable
            onPress={() => {
              jumpTo(item.page, item.verse);
              router.back();
            }}
            style={({ pressed }) => [
              styles.row,
              { borderColor: colors.border, backgroundColor: pressed ? colors.highlight : "transparent" },
            ]}
          >
            <Ionicons
              name={item.verse !== undefined ? "bookmark" : "document-text-outline"}
              size={22}
              color={colors.marker}
            />
            <View style={styles.body}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {snippet && <Text style={[styles.snippet, { color: colors.text }]}>{snippet}</Text>}
              <Text style={[styles.meta, { color: colors.muted }]}>
                {`صفحة ${arabicNumber(item.page)} – ${new Date(item.createdAt).toLocaleDateString("ar")}`}
              </Text>
            </View>
            <Pressable onPress={() => removeBookmark(item.id)} hitSlop={10} style={styles.delete}>
              <Ionicons name="trash-outline" size={20} color={colors.muted} />
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600", textAlign: "right" },
  snippet: { fontFamily: QURAN_FONT, fontSize: 18, lineHeight: 34, textAlign: "right", writingDirection: "rtl" },
  meta: { fontSize: 12, textAlign: "right", marginTop: 2 },
  delete: { padding: 4 },
});
