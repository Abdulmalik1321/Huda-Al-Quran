export type ThemeName = "light" | "sepia" | "dark";

export type Palette = {
  name: ThemeName;
  page: string;
  text: string;
  muted: string;
  accent: string;
  marker: string;
  highlight: string;
  mask: string;
  surface: string;
  border: string;
  statusBar: "light" | "dark";
};

export const themes: Record<ThemeName, Palette> = {
  light: {
    name: "light",
    page: "#FFFDF7",
    text: "#1C1A17",
    muted: "#7A7368",
    accent: "#2F6B4F",
    marker: "#8A6A2E",
    highlight: "rgba(47,107,79,0.18)",
    mask: "#E7E1D3",
    surface: "#F3EEE2",
    border: "#DDD5C3",
    statusBar: "dark",
  },
  sepia: {
    name: "sepia",
    page: "#F3E7CC",
    text: "#3A2C17",
    muted: "#85704F",
    accent: "#7B4F1D",
    marker: "#8A5A1E",
    highlight: "rgba(123,79,29,0.18)",
    mask: "#E0D0AE",
    surface: "#EADBB9",
    border: "#D4C097",
    statusBar: "dark",
  },
  dark: {
    name: "dark",
    page: "#121314",
    text: "#E8E3D6",
    muted: "#8C877C",
    accent: "#7CC4A0",
    marker: "#C9A65E",
    highlight: "rgba(124,196,160,0.22)",
    mask: "#2A2B2D",
    surface: "#1D1E20",
    border: "#2F3032",
    statusBar: "light",
  },
};

export const themeLabels: Record<ThemeName, string> = {
  light: "فاتح",
  sepia: "ورقي",
  dark: "ليلي",
};

/** Family name the Quran font is registered under (see app/_layout.tsx). */
export const QURAN_FONT = "hafs";
