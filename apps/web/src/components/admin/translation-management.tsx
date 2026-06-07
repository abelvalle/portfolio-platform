"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, type TranslationEntry, type TranslationMutation } from "@/lib/api";

const emptyDraft: TranslationMutation = {
  locale: "en",
  namespace: "public.hero",
  key: "",
  value: "",
  description: "",
  visible: true
};

export function TranslationManagement() {
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [selected, setSelected] = useState<TranslationEntry | null>(null);
  const [draft, setDraft] = useState<TranslationMutation>(emptyDraft);
  const [localeFilter, setLocaleFilter] = useState("en");
  const [namespaceFilter, setNamespaceFilter] = useState("");
  const [message, setMessage] = useState("Cargando traducciones.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const namespaces = useMemo(
    () => [...new Set(translations.map((item) => item.namespace))].sort(),
    [translations]
  );

  const loadTranslations = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextTranslations = await adminClient.translations({
        locale: localeFilter || undefined,
        namespace: namespaceFilter || undefined,
        includeHidden: "true"
      });
      setTranslations(nextTranslations);
      setMessage("Traducciones sincronizadas.");
    } catch {
      setMessage("No se pudieron cargar traducciones.");
    } finally {
      setIsLoading(false);
    }
  }, [localeFilter, namespaceFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTranslations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTranslations]);

  function selectTranslation(item: TranslationEntry) {
    setSelected(item);
    setDraft({
      locale: item.locale,
      namespace: item.namespace,
      key: item.key,
      value: item.value,
      description: item.description || "",
      visible: item.visible
    });
  }

  function newTranslation() {
    setSelected(null);
    setDraft({
      ...emptyDraft,
      locale: localeFilter || "en",
      namespace: namespaceFilter || "public.hero"
    });
  }

  async function saveTranslation() {
    if (!draft.locale.trim() || !draft.namespace.trim() || !draft.key.trim() || !draft.value.trim()) {
      setMessage("Locale, namespace, clave y valor son obligatorios.");
      return;
    }
    setIsSaving(true);
    try {
      if (selected) {
        await adminClient.updateTranslation(selected.id, {
          value: draft.value,
          description: draft.description || null,
          visible: draft.visible
        });
      } else {
        await adminClient.upsertTranslation(draft);
      }
      await loadTranslations();
      setMessage(selected ? "Traduccion actualizada." : "Traduccion creada.");
    } catch {
      setMessage("No se pudo guardar la traduccion.");
    } finally {
      setIsSaving(false);
    }
  }

  async function hideTranslation() {
    if (!selected) {
      return;
    }
    setIsSaving(true);
    try {
      await adminClient.deleteTranslation(selected.id);
      newTranslation();
      await loadTranslations();
      setMessage("Traduccion ocultada.");
    } catch {
      setMessage("No se pudo ocultar la traduccion.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-primary">i18n CMS</p>
          <h2 className="mt-1 text-xl font-semibold">Traducciones editables</h2>
          <p className="mt-2 text-sm text-muted-foreground">Copia publica preparada para sincronizarse desde backend.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={newTranslation}>
            <Plus data-icon="inline-start" />
            Nueva
          </Button>
          <Button type="button" variant="outline" onClick={loadTranslations} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="translationLocaleFilter">Locale</Label>
          <Input id="translationLocaleFilter" value={localeFilter} onChange={(event) => setLocaleFilter(event.target.value)} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="translationNamespaceFilter">Namespace</Label>
          <Input
            id="translationNamespaceFilter"
            list="translationNamespaces"
            value={namespaceFilter}
            onChange={(event) => setNamespaceFilter(event.target.value)}
            placeholder="public.hero"
          />
          <datalist id="translationNamespaces">
            {namespaces.map((namespace) => (
              <option key={namespace} value={namespace} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-[90px_1fr_1fr_90px] bg-muted/40 p-3 text-sm font-medium">
            <span>Locale</span>
            <span>Namespace</span>
            <span>Clave</span>
            <span>Estado</span>
          </div>
          {translations.length ? translations.map((item) => (
            <button
              key={item.id}
              type="button"
              className="grid w-full grid-cols-[90px_1fr_1fr_90px] gap-3 border-t border-border p-3 text-left text-sm hover:bg-muted/30"
              onClick={() => selectTranslation(item)}
            >
              <span>{item.locale}</span>
              <span className="truncate text-muted-foreground">{item.namespace}</span>
              <span className="truncate font-medium">{item.key}</span>
              <span><Badge variant="outline">{item.visible ? "visible" : "oculta"}</Badge></span>
            </button>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin traducciones para los filtros actuales.</div>
          )}
        </div>

        <div className="grid gap-3 rounded-lg border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="translationLocale">Locale</Label>
              <Input id="translationLocale" value={draft.locale} disabled={Boolean(selected)} onChange={(event) => setDraft((current) => ({ ...current, locale: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="translationKey">Clave</Label>
              <Input id="translationKey" value={draft.key} disabled={Boolean(selected)} onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="translationNamespace">Namespace</Label>
            <Input id="translationNamespace" value={draft.namespace} disabled={Boolean(selected)} onChange={(event) => setDraft((current) => ({ ...current, namespace: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="translationValue">Valor</Label>
            <Textarea id="translationValue" value={draft.value} rows={5} onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="translationDescription">Descripcion</Label>
            <Input id="translationDescription" value={draft.description || ""} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.visible}
              onChange={(event) => setDraft((current) => ({ ...current, visible: event.target.checked }))}
            />
            Visible en API publica
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={saveTranslation} disabled={isSaving}>
              <Save data-icon="inline-start" />
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={hideTranslation} disabled={isSaving || !selected}>
              <Trash2 data-icon="inline-start" />
              Ocultar
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
    </section>
  );
}
