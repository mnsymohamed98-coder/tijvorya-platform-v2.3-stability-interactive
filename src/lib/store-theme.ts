import type { StoreTheme, StoreThemePreset } from "@/types";

export const storeThemePresets: Record<StoreThemePreset, StoreTheme> = {
  modern: {
    preset: "modern",
    accentColor: "#1769e0",
    backgroundColor: "#f5f8fc",
    surfaceColor: "#ffffff",
    textColor: "#101828",
    heroStyle: "cover",
    layout: "grid",
    font: "system",
    buttonStyle: "solid",
    cardRadius: 14,
    announcement: "",
  },
  boutique: {
    preset: "boutique",
    accentColor: "#8c5b3e",
    backgroundColor: "#fbf7f2",
    surfaceColor: "#fffdf9",
    textColor: "#2e2018",
    heroStyle: "split",
    layout: "editorial",
    font: "serif",
    buttonStyle: "pill",
    cardRadius: 22,
    announcement: "",
  },
  minimal: {
    preset: "minimal",
    accentColor: "#111827",
    backgroundColor: "#ffffff",
    surfaceColor: "#ffffff",
    textColor: "#111827",
    heroStyle: "minimal",
    layout: "grid",
    font: "system",
    buttonStyle: "outline",
    cardRadius: 4,
    announcement: "",
  },
  bold: {
    preset: "bold",
    accentColor: "#0d8b91",
    backgroundColor: "#07151a",
    surfaceColor: "#10242a",
    textColor: "#f5fbfc",
    heroStyle: "cover",
    layout: "editorial",
    font: "rounded",
    buttonStyle: "solid",
    cardRadius: 8,
    announcement: "",
  },
};

export function normalizeStoreTheme(theme?: Partial<StoreTheme>, fallbackAccent = "#1769e0"): StoreTheme {
  const preset = theme?.preset && storeThemePresets[theme.preset] ? theme.preset : "modern";
  const base = storeThemePresets[preset];
  return {
    ...base,
    ...theme,
    preset,
    accentColor: theme?.accentColor ?? fallbackAccent,
    cardRadius: Math.min(32, Math.max(0, Number(theme?.cardRadius ?? base.cardRadius))),
  };
}
