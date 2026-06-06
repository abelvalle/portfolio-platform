export type ThemeContrastTokens = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  cardStyle: string;
};

export type ThemeContrastCheck = {
  id: string;
  label: string;
  description: string;
  ratio: number | null;
  requiredRatio: number;
  passes: boolean;
  severity: "critical" | "warning";
};

export function getThemeContrastChecks(theme: ThemeContrastTokens): ThemeContrastCheck[] {
  const cardBackground = blendedCardBackground(theme);

  return [
    buildCheck({
      id: "text-background",
      label: "Texto / fondo",
      description: "Legibilidad principal de landing, CV online y panel.",
      foreground: theme.textColor,
      background: theme.backgroundColor,
      requiredRatio: 4.5,
      severity: "critical"
    }),
    buildCheck({
      id: "secondary-background",
      label: "Texto secundario / fondo",
      description: "Subtitulos, metadata y textos de apoyo.",
      foreground: theme.secondaryColor,
      background: theme.backgroundColor,
      requiredRatio: 4.5,
      severity: "warning"
    }),
    buildCheck({
      id: "primary-background",
      label: "Acento / fondo",
      description: "CTAs, enlaces y estados interactivos.",
      foreground: theme.primaryColor,
      background: theme.backgroundColor,
      requiredRatio: 3,
      severity: "warning"
    }),
    buildCheck({
      id: "text-card",
      label: "Texto / card",
      description: "Contenido sobre cards generadas con el color secundario.",
      foreground: theme.textColor,
      background: cardBackground,
      requiredRatio: 4.5,
      severity: "critical"
    }),
    buildCheck({
      id: "primary-card",
      label: "Acento / card",
      description: "Badges, bordes y pequenos elementos sobre cards.",
      foreground: theme.primaryColor,
      background: cardBackground,
      requiredRatio: 3,
      severity: "warning"
    })
  ];
}

export function getContrastRatio(foreground: string, background: string) {
  const foregroundRgb = parseHexColor(foreground);
  const backgroundRgb = parseHexColor(background);

  if (!foregroundRgb || !backgroundRgb) {
    return null;
  }

  const foregroundLuminance = relativeLuminance(foregroundRgb);
  const backgroundLuminance = relativeLuminance(backgroundRgb);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function buildCheck({
  id,
  label,
  description,
  foreground,
  background,
  requiredRatio,
  severity
}: {
  id: string;
  label: string;
  description: string;
  foreground: string;
  background: string;
  requiredRatio: number;
  severity: ThemeContrastCheck["severity"];
}): ThemeContrastCheck {
  const ratio = getContrastRatio(foreground, background);

  return {
    id,
    label,
    description,
    ratio,
    requiredRatio,
    passes: ratio !== null && ratio >= requiredRatio,
    severity
  };
}

function blendedCardBackground(theme: ThemeContrastTokens) {
  const alpha = theme.cardStyle === "solid" ? 0.27 : 0.13;
  return blendHexColor(theme.secondaryColor, theme.backgroundColor, alpha) || theme.backgroundColor;
}

function blendHexColor(foreground: string, background: string, alpha: number) {
  const foregroundRgb = parseHexColor(foreground);
  const backgroundRgb = parseHexColor(background);

  if (!foregroundRgb || !backgroundRgb) {
    return null;
  }

  const blended = foregroundRgb.map((channel, index) =>
    Math.round(channel * alpha + backgroundRgb[index] * (1 - alpha))
  );

  return `#${blended.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function parseHexColor(value: string): [number, number, number] | null {
  const normalized = value.trim();
  const shortMatch = normalized.match(/^#([0-9A-Fa-f]{3})$/);
  if (shortMatch) {
    return shortMatch[1].split("").map((channel) => parseInt(`${channel}${channel}`, 16)) as [number, number, number];
  }

  const longMatch = normalized.match(/^#([0-9A-Fa-f]{6})$/);
  if (!longMatch) {
    return null;
  }

  return [
    parseInt(longMatch[1].slice(0, 2), 16),
    parseInt(longMatch[1].slice(2, 4), 16),
    parseInt(longMatch[1].slice(4, 6), 16)
  ];
}

function relativeLuminance([red, green, blue]: [number, number, number]) {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
