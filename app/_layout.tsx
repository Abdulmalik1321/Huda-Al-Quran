import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { DevSettings, I18nManager, Platform } from "react-native";
import "react-native-reanimated";

import { StoreProvider, useStore } from "@/lib/store";
import { QURAN_FONT } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

// The Mushaf lays out its own right-to-left lines and pages, so the native
// layout direction stays left-to-right. Earlier versions forced RTL, which
// is persisted natively and needs one reload to undo.
const needsDirectionReset = I18nManager.isRTL && Platform.OS !== "web";
I18nManager.allowRTL(false);
if (needsDirectionReset) I18nManager.forceRTL(false);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ [QURAN_FONT]: require("../assets/fonts/Othmani.ttf") });

  useEffect(() => {
    if (!needsDirectionReset) return;
    if (__DEV__) DevSettings.reload();
    else Updates.reloadAsync().catch(() => {});
  }, []);

  return (
    <StoreProvider>
      <Navigator fontsLoaded={fontsLoaded} />
    </StoreProvider>
  );
}

function Navigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, colors } = useStore();
  const loaded = ready && fontsLoaded;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  const base = colors.name === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.page, card: colors.surface, text: colors.text, border: colors.border, primary: colors.accent },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.text },
          headerBackTitle: "رجوع",
          contentStyle: { backgroundColor: colors.page },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="contents" options={{ title: "الفهرس" }} />
        <Stack.Screen name="search" options={{ title: "البحث" }} />
        <Stack.Screen name="bookmarks" options={{ title: "العلامات" }} />
        <Stack.Screen name="settings" options={{ title: "الإعدادات" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
