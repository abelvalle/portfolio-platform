"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, type CvItem, type CvMutation } from "@/lib/api";

const emptyDraft: CvMutation = {
  name: "",
  headline: "",
  summary: "",
  status: "draft"
};

export function CvEditor() {
  const [cv, setCv] = useState<CvItem | null>(null);
  const [draft, setDraft] = useState<CvMutation>(emptyDraft);
  const [message, setMessage] = useState("Cargando CV principal.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCv();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadCv() {
    setIsLoading(true);
    try {
      const nextCv = await cvClient.primary();
      setCv(nextCv);
      setDraft({
        name: nextCv.name,
        headline: nextCv.headline,
        summary: nextCv.summary,
        status: nextCv.status
      });
      setMessage("CV principal sincronizado con la API.");
    } catch {
      setMessage("No se pudo cargar el CV principal. Comprueba la sesion o el seed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCv() {
    if (!cv) {
      setMessage("No hay CV cargado para guardar.");
      return;
    }
    if (!draft.name.trim() || !draft.headline.trim() || !draft.summary.trim()) {
      setMessage("Nombre, titular y resumen son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await cvClient.update(cv.id, draft);
      setCv(updated);
      setMessage("CV guardado.");
    } catch {
      setMessage("No se pudo guardar el CV.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-primary">CV Manager</p>
          <h1 className="mt-2 text-3xl font-semibold">Editor de CV</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Edita los campos principales del CV publicado sin tocar codigo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cv?.isPrimary ? <Badge>principal</Badge> : null}
          <Badge variant="outline">{draft.status}</Badge>
          <Button type="button" variant="outline" onClick={loadCv} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cvName">Nombre</Label>
          <Input id="cvName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cvHeadline">Titular profesional</Label>
          <Input id="cvHeadline" value={draft.headline} onChange={(event) => setDraft((current) => ({ ...current, headline: event.target.value }))} />
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="cvSummary">Resumen profesional</Label>
          <Textarea id="cvSummary" rows={6} value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["draft", "published", "archived"] as const).map((status) => (
          <Button key={status} type="button" variant={draft.status === status ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, status }))}>
            {status}
          </Button>
        ))}
        <Button type="button" onClick={saveCv} disabled={isSaving}>
          <Save data-icon="inline-start" />
          {isSaving ? "Guardando..." : "Guardar CV"}
        </Button>
      </div>
    </section>
  );
}
