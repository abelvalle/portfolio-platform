"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminClient, type AnalyticsEvent, type AnalyticsSummary } from "@/lib/api";

const summaryLabels: Array<[keyof AnalyticsSummary, string]> = [
  ["totalVisits", "Visitas landing"],
  ["cvDownloads", "Descargas CV"],
  ["contactSubmits", "Formularios"],
  ["projectViews", "Vistas proyecto"]
];

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [message, setMessage] = useState("Cargando analitica.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadAnalytics() {
    setIsLoading(true);
    try {
      const [nextSummary, nextEvents] = await Promise.all([adminClient.analyticsSummary(), adminClient.analyticsEvents()]);
      setSummary(nextSummary);
      setEvents(nextEvents);
      setMessage("Analitica sincronizada con la API.");
    } catch {
      setMessage("No se pudo cargar analitica. Comprueba sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Analitica</h1>
            <p className="mt-2 text-sm text-muted-foreground">Resumen y eventos recientes desde la API.</p>
          </div>
          <Button type="button" variant="outline" onClick={loadAnalytics} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {summaryLabels.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{summary?.[key] ?? 0}</p>
          </div>
        ))}
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[180px_1fr_1fr_180px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Evento</span>
            <span>Ruta</span>
            <span>Etiqueta</span>
            <span>Fecha</span>
          </div>
          {events.length ? events.slice(0, 50).map((event) => (
            <div key={event.id} className="grid grid-cols-[180px_1fr_1fr_180px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-medium">{event.type}</span>
              <span className="truncate text-muted-foreground">{event.path || "-"}</span>
              <span className="truncate text-muted-foreground">{event.label || "-"}</span>
              <span className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin eventos registrados.</div>
          )}
        </div>
      </section>
    </div>
  );
}
