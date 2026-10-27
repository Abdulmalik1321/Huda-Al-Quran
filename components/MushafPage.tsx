import { memo, useMemo } from "react";
import { I18nManager, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { arabicNumber } from "@/lib/arabic";
import { pageInfo, pageLayout, PageWord, REF_LINE_EM, surahs } from "@/lib/quran";
import { Palette, QURAN_FONT } from "@/lib/theme";

export const LINES_PER_PAGE = 15;
const FONT_LINE_HEIGHT = 1.8;
const HEADER_HEIGHT = 30;
const FOOTER_HEIGHT = 30;
const SIDE_PADDING = 10;

// Lines are always laid out right to left, whatever the native layout direction is.
const ROW_RTL = I18nManager.isRTL ? "row" : "row-reverse";

export type PageMetrics = {
  width: number;
  height: number;
  contentWidth: number;
  slot: number;
  fontSize: number;
};

export function pageMetrics(width: number, height: number, insetTop: number, insetBottom: number): PageMetrics {
  const contentWidth = width - SIDE_PADDING * 2;
  const available = height - insetTop - insetBottom - HEADER_HEIGHT - FOOTER_HEIGHT;
  const slot = available / LINES_PER_PAGE;
  const fontSize = Math.min(contentWidth / REF_LINE_EM, slot / FONT_LINE_HEIGHT);
  return { width, height, contentWidth, slot, fontSize };
}

export type MemorizeState = {
  active: boolean;
  /** Words of this page in reading order that have been revealed (index < revealed). */
  revealed: number;
  hintFirstWord: boolean;
};

type Props = {
  page: number;
  metrics: PageMetrics;
  insetTop: number;
  insetBottom: number;
  colors: Palette;
  highlightVerse: number | null;
  memorize: MemorizeState;
  bookmarked: boolean;
  memorized: boolean;
  onPress: () => void;
  onWordPress: (word: PageWord) => void;
  onVerseLongPress: (verse: number) => void;
};

function MushafPageView({
  page,
  metrics,
  insetTop,
  insetBottom,
  colors,
  highlightVerse,
  memorize,
  bookmarked,
  memorized,
  onPress,
  onWordPress,
  onVerseLongPress,
}: Props) {
  const { lines } = useMemo(() => pageLayout(page), [page]);
  const info = pageInfo[page - 1];
  const { fontSize, slot, contentWidth } = metrics;
  const isShortPage = lines.length < LINES_PER_PAGE;

  const isHidden = (w: PageWord) =>
    memorize.active && !w.isMark && w.index >= memorize.revealed && !(memorize.hintFirstWord && w.firstOfVerse);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.page, { width: metrics.width, height: metrics.height, backgroundColor: colors.page }]}
    >
      <View style={{ height: insetTop }} />
      <View style={[styles.header, { flexDirection: ROW_RTL }]}>
        <Text style={[styles.headerText, { color: colors.muted }]}>
          {info.surahs.map((s) => `سورة ${surahs[s - 1].name}`).join(" - ")}
        </Text>
        <Text style={[styles.headerText, { color: colors.muted }]}>{`الجزء ${arabicNumber(info.juz)}`}</Text>
      </View>

      <View style={[styles.body, { justifyContent: isShortPage ? "center" : "flex-start" }]}>
        {lines.map((line, li) => {
          if (line.kind === "header") {
            return (
              <View key={li} style={[styles.lineSlot, { height: slot }]}>
                <ImageBackground
                  source={require("@/assets/images/surah-frame.png")}
                  resizeMode="stretch"
                  style={[styles.frame, { width: contentWidth, height: Math.min(slot * 0.92, contentWidth / 9) }]}
                  imageStyle={{ opacity: colors.name === "dark" ? 0.8 : 1 }}
                >
                  <Text style={[styles.frameText, { fontSize: fontSize * 0.95 }]}>
                    {`سُورَةُ ${surahs[line.surah - 1].name}`}
                  </Text>
                </ImageBackground>
              </View>
            );
          }
          if (line.kind === "basmalah") {
            return (
              <View key={li} style={[styles.lineSlot, { height: slot }]}>
                <Text style={[styles.quran, { fontSize, color: colors.text }]}>{line.text}</Text>
              </View>
            );
          }
          const naturalWidth = line.widthEm * fontSize;
          const lineFont = naturalWidth > contentWidth ? (contentWidth / line.widthEm) * 0.99 : fontSize;
          return (
            <View
              key={li}
              style={[
                styles.lineSlot,
                {
                  height: slot,
                  flexDirection: ROW_RTL,
                  justifyContent: line.centered ? "center" : "space-between",
                },
              ]}
            >
              {line.words.map((w) => {
                const hidden = isHidden(w);
                const highlighted = highlightVerse === w.verse;
                return (
                  <Pressable
                    key={w.index}
                    onPress={() => onWordPress(w)}
                    onLongPress={() => onVerseLongPress(w.verse)}
                    delayLongPress={400}
                    style={[
                      styles.word,
                      { marginHorizontal: line.centered ? lineFont * 0.12 : 0 },
                      hidden && { backgroundColor: colors.mask },
                      highlighted && !hidden && { backgroundColor: colors.highlight },
                    ]}
                  >
                    <Text
                      selectable={false}
                      style={[
                        styles.quran,
                        {
                          fontSize: lineFont,
                          color: hidden ? "transparent" : w.isMark ? colors.marker : colors.text,
                        },
                      ]}
                    >
                      {w.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>

      <View style={[styles.footer, { flexDirection: ROW_RTL }]}>
        <View style={styles.footerSide}>
          {memorized && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
        </View>
        <Text style={[styles.pageNumber, { color: colors.muted }]}>{arabicNumber(page)}</Text>
        <View style={styles.footerSide}>
          {bookmarked && <Ionicons name="bookmark" size={16} color={colors.marker} />}
        </View>
      </View>
      <View style={{ height: insetBottom }} />
    </Pressable>
  );
}

export const MushafPage = memo(MushafPageView);

const styles = StyleSheet.create({
  page: { overflow: "hidden" },
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: SIDE_PADDING + 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: { fontSize: 13, writingDirection: "rtl" },
  body: { flex: 1, paddingHorizontal: SIDE_PADDING },
  lineSlot: { alignItems: "center", justifyContent: "center" },
  frame: { alignItems: "center", justifyContent: "center" },
  frameText: { fontFamily: QURAN_FONT, color: "#1C1A17", includeFontPadding: false },
  word: { borderRadius: 6 },
  quran: { fontFamily: QURAN_FONT, includeFontPadding: false, writingDirection: "rtl" },
  footer: {
    height: FOOTER_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIDE_PADDING + 6,
  },
  footerSide: { width: 40, alignItems: "center" },
  pageNumber: { fontSize: 14, minWidth: 40, textAlign: "center" },
});
