import type { CSSProperties } from "react";
import type { PortfolioSnapshot } from "./portfolio-data";

export function buildPublicThemeStyle(theme: PortfolioSnapshot["theme"]) {
  const primary = safeColor(theme.primaryColor, "#5eead4");
  const secondary = safeColor(theme.secondaryColor, "#94a3b8");
  const background = safeColor(theme.backgroundColor, "#07090d");
  const foreground = safeColor(theme.textColor, "#f8fafc");
  const radius = safeLength(theme.borderRadius, "8px");
  const fontFamily = "fontFamily" in theme ? safeFontFamily(String(theme.fontFamily || "")) : undefined;

  return {
    "--primary": primary,
    "--ring": primary,
    "--background": background,
    "--foreground": foreground,
    "--card": `color-mix(in oklch, ${background}, ${foreground} 6%)`,
    "--card-foreground": foreground,
    "--popover": `color-mix(in oklch, ${background}, ${foreground} 8%)`,
    "--popover-foreground": foreground,
    "--secondary": `color-mix(in oklch, ${background}, ${foreground} 10%)`,
    "--secondary-foreground": foreground,
    "--muted": `color-mix(in oklch, ${background}, ${foreground} 12%)`,
    "--muted-foreground": secondary,
    "--accent": `color-mix(in oklch, ${primary}, ${background} 72%)`,
    "--accent-foreground": foreground,
    "--border": `color-mix(in oklch, ${foreground}, transparent 78%)`,
    "--input": `color-mix(in oklch, ${foreground}, transparent 84%)`,
    "--radius": radius,
    fontFamily
  } as CSSProperties;
}

function safeColor(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : fallback;
}

function safeLength(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }
  const trimmed = value.trim();
  return /^\d+(\.\d+)?(px|rem)$/.test(trimmed) ? trimmed : fallback;
}

function safeFontFamily(value: string) {
  const trimmed = value.trim();
  return /^[a-zA-Z0-9 ,_-]{1,80}$/.test(trimmed) ? trimmed : undefined;
}
