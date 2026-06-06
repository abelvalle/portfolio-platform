"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminClient,
  type AnalyticsChannels,
  type AnalyticsEvent,
  type AnalyticsPrivacyStatus,
  type AnalyticsSummary,
  type AnalyticsTimeSeriesPoint
} from "@/lib/api";

const summaryLabels: Array<[keyof AnalyticsSummary, string]> = [
  ["totalVisits", "Visitas landing"],
  ["cvDownloads", "Descargas CV"],
  ["contactSubmits", "Formularios"],
  ["projectViews", "Vistas proyecto"]
];

const eventTypeOptions = [
  { label: "Todos", value: "" },
  { label: "Visita landing", value: "landing_visit" },
  { label: "Descarga CV", value: "cv_download" },
  { label: "Formulario contacto", value: "contact_submit" },
  { label: "Vista proyecto", value: "project_view" }
];

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [timeSeries, setTimeSeries] = useState<AnalyticsTimeSeriesPoint[]>([]);
  const [channels, setChannels] = useState<AnalyticsChannels | null>(null);
  const [privacy, setPrivacy] = useState<AnalyticsPrivacyStatus | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [message, setMessage] = useState("Cargando analitica.");
  const [isLoading, setIsLoading] = useState(true);
  const [isPruning, setIsPruning] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = { from: fromDate || undefined, to: toDate || undefined };
      const [nextSummary, nextEvents, nextTimeSeries, nextChannels, nextPrivacy] = await Promise.all([
        adminClient.analyticsSummary(filters),
        adminClient.analyticsEvents({ ...filters, type: eventType || undefined }),
        adminClient.analyticsTimeSeries({ ...filters, type: eventType || undefined }),
        adminClient.analyticsChannels({ ...filters, type: eventType || undefined }),
        adminClient.analyticsPrivacy()
      ]);
      setSummary(nextSummary);
      setEvents(nextEvents);
      setTimeSeries(nextTimeSeries);
      setChannels(nextChannels);
      setPrivacy(nextPrivacy);
      setMessage("Analitica sincronizada con filtros de API.");
    } catch {
      setMessage("No se pudo cargar analitica. Comprueba sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }, [eventType, fromDate, toDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAnalytics]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => isInsideDateRange(event.createdAt, fromDate, toDate) && (!eventType || event.type === eventType));
  }, [eventType, events, fromDate, toDate]);
  const trend = useMemo(() => buildAnalyticsTrend(timeSeries), [timeSeries]);
  const maxTypeCount = Math.max(...trend.topTypes.map((item) => item.count), 1);
  const maxDayCount = Math.max(...trend.daily.map((item) => item.total), 1);

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

  async function pruneRetention() {
    setIsPruning(true);
    try {
      const result = await adminClient.pruneAnalyticsRetention();
      await loadAnalytics();
      setMessage(`Retencion aplicada: ${result.deleted} eventos purgados.`);
    } catch {
      setMessage("No se pudo ejecutar la purga de retencion.");
    } finally {
      setIsPruning(false);
    }
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="analyticsFromDate">Desde</Label>
            <Input id="analyticsFromDate" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsToDate">Hasta</Label>
            <Input id="analyticsToDate" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsEventType">Tipo de evento</Label>
            <select
              id="analyticsEventType"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
            >
              {eventTypeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
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

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-primary">Privacidad analytics</p>
            <h2 className="mt-1 text-xl font-semibold">Retencion y metadata</h2>
          </div>
          <Button type="button" variant="outline" onClick={pruneRetention} disabled={isPruning || !privacy?.retentionDays}>
            {isPruning ? "Purgando..." : "Purgar retencion"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">retencion {privacy?.retentionDays ? `${privacy.retentionDays} dias` : "off"}</Badge>
          <Badge variant="outline">user-agent {privacy?.storeUserAgent === false ? "off" : "on"}</Badge>
          <Badge variant="outline">salt IP {privacy?.ipHashSaltConfigured ? "on" : "off"}</Badge>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-primary">Tendencias</p>
            <h2 className="mt-1 text-xl font-semibold">Actividad filtrada</h2>
          </div>
          <Badge variant="outline">{trend.totalEvents} eventos</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Dias activos</p>
            <p className="mt-2 text-2xl font-semibold">{trend.activeDays}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Dia con mas actividad</p>
            <p className="mt-2 text-2xl font-semibold">{trend.topDay || "Sin datos"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{trend.topDayCount} eventos</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Evento dominante</p>
            <p className="mt-2 text-2xl font-semibold">{trend.topType || "Sin datos"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{trend.topTypeCount} registros</p>
          </div>
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium text-muted-foreground">Serie diaria</p>
          {trend.daily.length ? trend.daily.map((item) => (
            <div key={item.date} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{item.date}</span>
                <span className="text-muted-foreground">{item.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(item.total / maxDayCount) * 100}%` }} />
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Sin serie historica para los filtros actuales.</p>
          )}
        </div>
        <div className="grid gap-3">
          <p className="text-sm font-medium text-muted-foreground">Top eventos</p>
          {trend.topTypes.length ? trend.topTypes.map((item) => (
            <div key={item.type} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{item.type}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / maxTypeCount) * 100}%` }} />
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Sin eventos suficientes para calcular tendencias.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-primary">Fuentes y canales</p>
            <h2 className="mt-1 text-xl font-semibold">Segmentacion de trafico</h2>
          </div>
          <Badge variant="outline">top 8</Badge>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <SegmentList title="Fuentes" items={channels?.sources || []} empty="Sin fuentes atribuidas." />
          <SegmentList title="Canales" items={channels?.channels || []} empty="Sin canales atribuidos." />
        </div>
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

function buildAnalyticsTrend(points: AnalyticsTimeSeriesPoint[]) {
  const byType = new Map<string, number>();

  for (const point of points) {
    for (const [type, count] of Object.entries(point.types)) {
      byType.set(type, (byType.get(type) || 0) + count);
    }
  }

  const topDay = [...points].sort((a, b) => b.total - a.total)[0];
  const topTypes = [...byType.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return {
    totalEvents: points.reduce((total, point) => total + point.total, 0),
    activeDays: points.filter((point) => point.total > 0).length,
    topDay: topDay?.date || "",
    topDayCount: topDay?.total || 0,
    topType: topTypes[0]?.type || "",
    topTypeCount: topTypes[0]?.count || 0,
    topTypes,
    daily: points.slice(-14)
  };
}

function SegmentList({
  title,
  items,
  empty
}: {
  title: string;
  items: Array<{ name: string; count: number }>;
  empty: string;
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {items.length ? items.map((item) => (
        <div key={item.name} className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </div>
      )) : (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
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
