import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { arabicNumber } from "@/lib/arabic";
import { surahs, verse, verseText } from "@/lib/quran";
import { useStore } from "@/lib/store";
import { QURAN_FONT } from "@/lib/theme";

type Props = {
  verseIndex: number | null;
  page: number;
  onClose: () => void;
  onMemorizeFrom: (verseIndex: number) => void;
};

export function formatVerseForSharing(index: number): string {
  const v = verse(index);
  return `${verseText(index)} ﴿${arabicNumber(v.ayah)}﴾\n[سورة ${surahs[v.surah - 1].name}: ${arabicNumber(v.ayah)}]`;
}

export function VerseActions({ verseIndex, page, onClose, onMemorizeFrom }: Props) {
  const { colors, isBookmarked, toggleBookmark } = useStore();
  const insets = useSafeAreaInsets();
  if (verseIndex === null) return null;

  const v = verse(verseIndex);
  const marked = isBookmarked(page, verseIndex);
  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string; run: () => void }[] = [
    {
      icon: marked ? "bookmark" : "bookmark-outline",
      label: marked ? "إزالة العلامة" : "علامة على الآية",
      run: () => toggleBookmark(page, verseIndex),
    },
    {
      icon: "eye-off-outline",
      label: "تسميع من هذه الآية",
      run: () => onMemorizeFrom(verseIndex),
    },
    {
      icon: "copy-outline",
      label: "نسخ الآية",
      run: () => Clipboard.setStringAsync(formatVerseForSharing(verseIndex)),
    },
    {
      icon: "share-outline",
      label: "مشاركة",
      run: () => Share.share({ message: formatVerseForSharing(verseIndex) }),
    },
  ];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 12 }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {`سورة ${surahs[v.surah - 1].name} - الآية ${arabicNumber(v.ayah)}`}
          </Text>
          <ScrollView style={styles.preview}>
            <Text style={[styles.verse, { color: colors.text }]}>{verseText(verseIndex)}</Text>
          </ScrollView>
          <View style={styles.actions}>
            {actions.map((a) => (
              <Pressable
                key={a.label}
                style={({ pressed }) => [
                  styles.action,
                  { borderColor: colors.border, backgroundColor: pressed ? colors.highlight : colors.page },
                ]}
                onPress={() => {
                  a.run();
                  onClose();
                }}
              >
                <Ionicons name={a.icon} size={22} color={colors.accent} />
                <Text style={[styles.actionLabel, { color: colors.text }]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  title: { fontSize: 16, fontWeight: "600", textAlign: "right", writingDirection: "rtl" },
  preview: { maxHeight: 140, marginVertical: 10 },
  verse: { fontFamily: QURAN_FONT, fontSize: 22, lineHeight: 40, textAlign: "right", writingDirection: "rtl" },
  actions: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  action: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: { fontSize: 15, writingDirection: "rtl" },
});
