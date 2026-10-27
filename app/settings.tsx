import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { useStore } from "@/lib/store";
import { Palette, themeLabels, ThemeName, themes } from "@/lib/theme";

const THEME_OPTIONS: (ThemeName | "system")[] = ["system", "light", "sepia", "dark"];

export default function Settings() {
  const { colors, settings, updateSettings, resetMemorized, memorized } = useStore();

  const confirmReset = () => {
    const run = () => resetMemorized();
    if (Platform.OS === "web") {
      if (window.confirm("هل تريد مسح تقدم الحفظ؟")) run();
      return;
    }
    Alert.alert("مسح تقدم الحفظ", "سيتم إلغاء تحديد جميع الصفحات المحفوظة.", [
      { text: "إلغاء", style: "cancel" },
      { text: "مسح", style: "destructive", onPress: run },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.page }} contentContainerStyle={styles.content}>
      <Text style={[styles.section, { color: colors.muted }]}>المظهر</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.themes}>
          {THEME_OPTIONS.map((t) => {
            const selected = settings.theme === t;
            const swatch = t === "system" ? undefined : themes[t];
            return (
              <Pressable
                key={t}
                onPress={() => updateSettings({ theme: t })}
                style={[
                  styles.theme,
                  {
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: swatch ? swatch.page : colors.page,
                  },
                ]}
              >
                <Text style={[styles.themeText, { color: swatch ? swatch.text : colors.text }]}>
                  {t === "system" ? "تلقائي" : themeLabels[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={[styles.section, { color: colors.muted }]}>القراءة والحفظ</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ToggleRow
          label="إبقاء الشاشة مضاءة أثناء القراءة"
          value={settings.keepAwake}
          onChange={(v) => updateSettings({ keepAwake: v })}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ToggleRow
          label="إظهار أول كلمة من كل آية في وضع التسميع"
          value={settings.hintFirstWord}
          onChange={(v) => updateSettings({ hintFirstWord: v })}
          colors={colors}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable onPress={confirmReset} style={styles.row} disabled={memorized.size === 0}>
          <Text style={[styles.label, { color: memorized.size === 0 ? colors.muted : "#C0392B" }]}>
            مسح تقدم الحفظ
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.section, { color: colors.muted }]}>طريقة الاستخدام</Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {[
          "اسحب الصفحة يميناً للانتقال إلى الصفحة التالية كما في المصحف.",
          "يفتح التطبيق دائماً على آخر صفحة قرأتها.",
          "اضغط على الصفحة لإظهار القائمة: الفهرس، البحث، العلامات، الإعدادات.",
          "اضغط مطولاً على آية لوضع علامة عليها أو نسخها أو مشاركتها أو بدء التسميع منها.",
          "وضع التسميع يخفي الكلمات؛ اضغط على أي كلمة لإظهار ما قبلها، أو استخدم أزرار «كلمة» و«آية».",
          "علّم الصفحات التي حفظتها لتتابع تقدمك في الفهرس.",
        ].map((tip) => (
          <Text key={tip} style={[styles.tip, { color: colors.text }]}>
            {`• ${tip}`}
          </Text>
        ))}
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>
        هذا التطبيق وقف لله تعالى عن هدى عبدالله الورقان وعن سعود رشيد المسعود
      </Text>
      <Text style={[styles.footer, { color: colors.muted }]}>
        نص المصحف وخطه: مجمع الملك فهد لطباعة المصحف الشريف (الإصدار ٢٫٠)
      </Text>
    </ScrollView>
  );

}

function ToggleRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  colors: Palette;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, paddingBottom: 40 },
  section: { fontSize: 13, textAlign: "right", marginTop: 14, marginBottom: 6, marginHorizontal: 4 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 6 },
  themes: { flexDirection: "row-reverse", gap: 8, paddingVertical: 8 },
  theme: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 2, alignItems: "center" },
  themeText: { fontSize: 14, fontWeight: "600" },
  row: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, gap: 12 },
  label: { fontSize: 15, flex: 1, textAlign: "right" },
  divider: { height: StyleSheet.hairlineWidth },
  tip: { fontSize: 14, lineHeight: 24, textAlign: "right", paddingVertical: 3, writingDirection: "rtl" },
  footer: { fontSize: 12, textAlign: "center", marginTop: 16, lineHeight: 20 },
});
