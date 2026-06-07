"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Eye, Palette, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicationHistoryLink } from "@/components/admin/publication-history-link";
import { Switch } from "@/components/ui/switch";
import { adminClient } from "@/lib/api";
import { getThemeContrastChecks } from "@/lib/theme-contrast";

type ThemeTokens = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: string;
  cardStyle: string;
  animationIntensity: string;
  colorMode: string;
};

const defaultTheme: ThemeTokens = {
  primaryColor: "#5eead4",
  secondaryColor: "#94a3b8",
  backgroundColor: "#07090d",
  textColor: "#f8fafc",
  fontFamily: "Inter",
  borderRadius: "8px",
  cardStyle: "subtle",
  animationIntensity: "60",
  colorMode: "dark"
};

export function ThemeEditor({ initialTheme }: { initialTheme?: Partial<ThemeTokens> }) {
  const [theme, setTheme] = useState<ThemeTokens>(() => normalizeTheme(initialTheme));
  const [saving, setSaving] = useState<"draft" | "publish" | null>(null);
  const contrastChecks = useMemo(() => getThemeContrastChecks(theme), [theme]);
  const criticalContrastFailures = contrastChecks.filter((check) => !check.passes && check.severity === "critical");

  const previewStyle = useMemo<CSSProperties>(() => ({
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    borderColor: withAlpha(theme.secondaryColor, "55"),
    borderRadius: theme.borderRadius,
    fontFamily: theme.fontFamily
  }), [theme]);

  const cardStyle = useMemo<CSSProperties>(() => ({
    backgroundColor: withAlpha(theme.secondaryColor, theme.cardStyle === "solid" ? "44" : "20"),
    borderColor: withAlpha(theme.primaryColor, "66"),
    borderRadius: theme.borderRadius
  }), [theme]);

  const updateTheme = (key: keyof ThemeTokens, value: string) => {
    setTheme((current) => ({ ...current, [key]: value }));
  };

  async function save(mode: "draft" | "publish") {
    if (mode === "publish" && criticalContrastFailures.length > 0) {
      toast.error("No se puede publicar: revisa el contraste critico del tema.");
      return;
    }

    setSaving(mode);
    try {
      const payload = mode === "draft"
        ? { draftJson: theme }
        : { ...theme, draftJson: theme, publishedAt: new Date().toISOString() };
      await adminClient.updateTheme(payload);
      toast.success(mode === "draft" ? "Borrador de tema guardado." : "Tema publicado.");
    } catch {
      toast.error("No se pudo guardar el tema. Revisa la API o la sesión.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Palette />
            Editor visual de estilos
          </CardTitle>
          <PublicationHistoryLink />
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <ColorField label="Color principal" value={theme.primaryColor} onChange={(value) => updateTheme("primaryColor", value)} />
            <ColorField label="Color secundario" value={theme.secondaryColor} onChange={(value) => updateTheme("secondaryColor", value)} />
            <ColorField label="Color de fondo" value={theme.backgroundColor} onChange={(value) => updateTheme("backgroundColor", value)} />
            <ColorField label="Color de texto" value={theme.textColor} onChange={(value) => updateTheme("textColor", value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fontFamily">Tipografía</Label>
              <Input
                id="fontFamily"
                value={theme.fontFamily}
                onChange={(event) => updateTheme("fontFamily", event.target.value)}
                placeholder="Inter"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="borderRadius">Radio de bordes</Label>
              <Input
                id="borderRadius"
                value={theme.borderRadius}
                onChange={(event) => updateTheme("borderRadius", event.target.value)}
                placeholder="8px"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="cardStyle">Estilo de cards</Label>
              <select
                id="cardStyle"
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                value={theme.cardStyle}
                onChange={(event) => updateTheme("cardStyle", event.target.value)}
              >
                <option value="subtle">Sutil</option>
                <option value="solid">Sólido</option>
                <option value="outline">Outline</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="animationIntensity">Intensidad de animaciones</Label>
              <Input
                id="animationIntensity"
                type="range"
                min={0}
                max={100}
                value={theme.animationIntensity}
                onChange={(event) => updateTheme("animationIntensity", event.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <Label htmlFor="colorMode">Modo oscuro</Label>
            <Switch
              id="colorMode"
              checked={theme.colorMode === "dark"}
              onCheckedChange={(checked) => updateTheme("colorMode", checked ? "dark" : "light")}
            />
          </div>

          <section className="grid gap-3 rounded-lg border border-border p-4" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Contraste y accesibilidad</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Validacion WCAG AA para los colores principales antes de publicar.
                </p>
              </div>
              <Badge variant={criticalContrastFailures.length > 0 ? "destructive" : "secondary"}>
                {criticalContrastFailures.length > 0 ? "Revisar" : "AA critico OK"}
              </Badge>
            </div>
            <div className="grid gap-2">
              {contrastChecks.map((check) => (
                <div
                  key={check.id}
                  className="grid gap-2 rounded-lg border border-border/70 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{check.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatRatio(check.ratio)} / {check.requiredRatio}:1
                    </span>
                    <Badge variant={check.passes ? "outline" : "destructive"}>
                      {check.passes ? "Pasa" : "Falla"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            {criticalContrastFailures.length > 0 ? (
              <p className="text-sm text-destructive">
                La publicacion queda bloqueada hasta corregir texto/fondo o texto/card.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Los contrastes criticos cumplen AA; revisa tambien acentos y texto secundario.
              </p>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" disabled={Boolean(saving)} onClick={() => save("draft")}>
              <Save data-icon="inline-start" />
              {saving === "draft" ? "Guardando..." : "Guardar borrador"}
            </Button>
            <Button type="button" disabled={Boolean(saving) || criticalContrastFailures.length > 0} onClick={() => save("publish")}>
              <Eye data-icon="inline-start" />
              {saving === "publish" ? "Publicando..." : "Publicar tema"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 rounded-lg border p-6" style={previewStyle}>
            <div>
              <p className="font-mono text-xs" style={{ color: theme.primaryColor }}>01 / Preview</p>
              <h3 className="mt-3 text-3xl font-semibold">Abel Valle Rosa</h3>
              <p className="mt-3 text-sm" style={{ color: theme.secondaryColor }}>IT Project Manager · Delivery Manager</p>
            </div>
            <div className="grid gap-3 border p-4" style={cardStyle}>
              <p className="text-sm font-medium">Delivery con foco ejecutivo</p>
              <p className="text-sm leading-6" style={{ color: theme.secondaryColor }}>
                KPIs, UAT, cliente y equipos técnicos conectados en una experiencia sobria y editable.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Delivery", "KPIs", "UAT"].map((item) => (
                  <span
                    key={item}
                    className="rounded-md border px-2 py-1 text-xs"
                    style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={label}>{label}</Label>
      <div className="grid grid-cols-[44px_1fr] gap-2">
        <Input id={`${label}-swatch`} type="color" value={value} onChange={(event) => onChange(event.target.value)} className="p-1" />
        <Input id={label} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

function normalizeTheme(initialTheme?: Partial<ThemeTokens>): ThemeTokens {
  const merged = { ...defaultTheme, ...initialTheme };
  return {
    ...merged,
    animationIntensity: normalizeAnimationIntensity(merged.animationIntensity)
  };
}

function normalizeAnimationIntensity(value?: string) {
  if (!value) return defaultTheme.animationIntensity;
  if (value === "low") return "25";
  if (value === "medium") return "60";
  if (value === "high") return "90";
  return value;
}

function withAlpha(hex: string, alpha: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

function formatRatio(ratio: number | null) {
  return ratio === null ? "N/A" : `${ratio.toFixed(1)}:1`;
}
