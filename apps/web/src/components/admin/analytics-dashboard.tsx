"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [message, setMessage] = useState("Cargando analitica.");
  const [isLoading, setIsLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAnalytics]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => isInsideDateRange(event.createdAt, fromDate, toDate));
  }, [events, fromDate, toDate]);

  function exportCsv() {
    const blob = new Blob([buildCsv(filteredEvents)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analytics-events.csv";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("CSV de eventos filtrados generado.");
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Analitica</h1>
            <p className="mt-2 text-sm text-muted-foreground">Resumen global y eventos recientes desde la API.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportCsv} disabled={!filteredEvents.length}>
              <Download data-icon="inline-start" />
              Exportar CSV
            </Button>
            <Button type="button" variant="outline" onClick={loadAnalytics} disabled={isLoading}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
              Actualizar
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="analyticsFromDate">Desde</Label>
            <Input id="analyticsFromDate" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsToDate">Hasta</Label>
            <Input id="analyticsToDate" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
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
          {filteredEvents.length ? filteredEvents.slice(0, 50).map((event) => (
            <div key={event.id} className="grid grid-cols-[180px_1fr_1fr_180px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-medium">{event.type}</span>
              <span className="truncate text-muted-foreground">{event.path || "-"}</span>
              <span className="truncate text-muted-foreground">{event.label || "-"}</span>
              <span className="text-muted-foreground">{formatDate(event.createdAt)}</span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin eventos para los filtros actuales.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function isInsideDateRange(createdAt: string, fromDate: string, toDate: string) {
  const createdTime = new Date(createdAt).getTime();
  if (Number.isNaN(createdTime)) {
    return true;
  }
  if (fromDate && createdTime < new Date(`${fromDate}T00:00:00`).getTime()) {
    return false;
  }
  if (toDate && createdTime > new Date(`${toDate}T23:59:59`).getTime()) {
    return false;
  }
  return true;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function buildCsv(events: AnalyticsEvent[]) {
  const rows = [
    ["type", "path", "label", "createdAt"],
    ...events.map((event) => [event.type, event.path || "", event.label || "", event.createdAt])
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
