"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Target, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminClient,
  type AnalyticsChannelFunnel,
  type AnalyticsChannels,
  type AnalyticsEvent,
  type AnalyticsFunnel,
  type AnalyticsFunnelDefinition,
  type AnalyticsGoalProgress,
  type AnalyticsLabels,
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
  { label: "Vista proyecto", value: "project_view" },
  { label: "Click LinkedIn", value: "linkedin_click" },
  { label: "Adaptacion CV", value: "cv_adaptation" }
];

const goalPeriodOptions = [
  { label: "Diario", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensual", value: "monthly" },
  { label: "Trimestral", value: "quarterly" },
  { label: "Personalizado", value: "custom" }
];

const goalEventTypeOptions = eventTypeOptions.filter((option) => option.value);

const fallbackFunnelDefinitions: AnalyticsFunnelDefinition[] = [
  {
    id: "fallback-landing-cv-contact",
    key: "landing-cv-contact",
    name: "Landing -> CV -> Contacto",
    description: "Embudo principal de conversion publica.",
    steps: ["landing_visit", "cv_download", "contact_submit"],
    visible: true,
    order: 0
  },
  {
    id: "fallback-landing-project-contact",
    key: "landing-project-contact",
    name: "Landing -> Proyecto -> Contacto",
    description: "Valida el interes generado por proyectos destacados.",
    steps: ["landing_visit", "project_view", "contact_submit"],
    visible: true,
    order: 1
  },
  {
    id: "fallback-landing-linkedin-cv",
    key: "landing-linkedin-cv",
    name: "Landing -> LinkedIn -> CV",
    description: "Mide investigacion de perfil antes de descargar CV.",
    steps: ["landing_visit", "linkedin_click", "cv_download"],
    visible: true,
    order: 2
  }
];

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [timeSeries, setTimeSeries] = useState<AnalyticsTimeSeriesPoint[]>([]);
  const [channels, setChannels] = useState<AnalyticsChannels | null>(null);
  const [labels, setLabels] = useState<AnalyticsLabels | null>(null);
  const [funnel, setFunnel] = useState<AnalyticsFunnel | null>(null);
  const [funnelDefinitions, setFunnelDefinitions] = useState<AnalyticsFunnelDefinition[]>(fallbackFunnelDefinitions);
  const [goals, setGoals] = useState<AnalyticsGoalProgress[]>([]);
  const [channelFunnel, setChannelFunnel] = useState<AnalyticsChannelFunnel | null>(null);
  const [privacy, setPrivacy] = useState<AnalyticsPrivacyStatus | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [funnelSteps, setFunnelSteps] = useState("landing_visit,cv_download,contact_submit");
  const [funnelDraftName, setFunnelDraftName] = useState(fallbackFunnelDefinitions[0].name);
  const [funnelDraftDescription, setFunnelDraftDescription] = useState(fallbackFunnelDefinitions[0].description || "");
  const [funnelDraftSteps, setFunnelDraftSteps] = useState(fallbackFunnelDefinitions[0].steps.join(","));
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [goalDraftName, setGoalDraftName] = useState("");
  const [goalDraftDescription, setGoalDraftDescription] = useState("");
  const [goalDraftEventType, setGoalDraftEventType] = useState("landing_visit");
  const [goalDraftEventTypes, setGoalDraftEventTypes] = useState<string[]>(["landing_visit"]);
  const [goalDraftTargetCount, setGoalDraftTargetCount] = useState("10");
  const [goalDraftPeriod, setGoalDraftPeriod] = useState("monthly");
  const [message, setMessage] = useState("Cargando analitica.");
  const [isLoading, setIsLoading] = useState(true);
  const [isPruning, setIsPruning] = useState(false);
  const [isSavingFunnel, setIsSavingFunnel] = useState(false);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters = { from: fromDate || undefined, to: toDate || undefined };
      const [
        nextSummary,
        nextEvents,
        nextTimeSeries,
        nextChannels,
        nextLabels,
        nextFunnel,
        nextFunnelDefinitions,
        nextGoals,
        nextChannelFunnel,
        nextPrivacy
      ] = await Promise.all([
        adminClient.analyticsSummary(filters),
        adminClient.analyticsEvents({ ...filters, type: eventType || undefined }),
        adminClient.analyticsTimeSeries({ ...filters, type: eventType || undefined }),
        adminClient.analyticsChannels({ ...filters, type: eventType || undefined }),
        adminClient.analyticsLabels({ ...filters, type: "cv_adaptation" }),
        adminClient.analyticsFunnel({ ...filters, steps: funnelSteps || undefined }),
        adminClient.analyticsFunnelDefinitions().catch(() => fallbackFunnelDefinitions),
        adminClient.analyticsGoalsProgress(filters).catch(() => []),
        adminClient.analyticsChannelFunnel(filters),
        adminClient.analyticsPrivacy()
      ]);
      setSummary(nextSummary);
      setEvents(nextEvents);
      setTimeSeries(nextTimeSeries);
      setChannels(nextChannels);
      setLabels(nextLabels);
      setFunnel(nextFunnel);
      setFunnelDefinitions(nextFunnelDefinitions.length ? nextFunnelDefinitions : fallbackFunnelDefinitions);
      setGoals(nextGoals);
      setChannelFunnel(nextChannelFunnel);
      setPrivacy(nextPrivacy);
      setMessage("Analitica sincronizada con filtros de API.");
    } catch {
      setMessage("No se pudo cargar analitica. Comprueba sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }, [eventType, fromDate, funnelSteps, toDate]);

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
  const selectedFunnelDefinition = funnelDefinitions.find((definition) => definition.steps.join(",") === funnelSteps);
  const selectedFunnelLabel = selectedFunnelDefinition?.name || "Embudo configurable";
  const selectedFunnelIsPersisted = Boolean(selectedFunnelDefinition && !selectedFunnelDefinition.id.startsWith("fallback-"));
  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId);

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

  function exportApiCsv() {
    window.location.href = adminClient.analyticsExportUrl({
      from: fromDate || undefined,
      to: toDate || undefined,
      type: eventType || undefined
    });
    setMessage("Descarga CSV desde API iniciada.");
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

  function selectFunnel(steps: string) {
    setFunnelSteps(steps);
    const definition = funnelDefinitions.find((item) => item.steps.join(",") === steps);
    if (definition) {
      setFunnelDraftName(definition.name);
      setFunnelDraftDescription(definition.description || "");
      setFunnelDraftSteps(definition.steps.join(","));
    }
  }

  async function saveFunnelDefinition() {
    const steps = parseFunnelSteps(funnelDraftSteps);
    if (!funnelDraftName.trim() || steps.length < 2 || steps.length > 6) {
      setMessage("El embudo necesita nombre y entre 2 y 6 pasos validos.");
      return;
    }

    setIsSavingFunnel(true);
    try {
      if (selectedFunnelDefinition && selectedFunnelIsPersisted) {
        const updated = await adminClient.updateAnalyticsFunnelDefinition(selectedFunnelDefinition.id, {
          name: funnelDraftName,
          description: funnelDraftDescription || null,
          steps,
          visible: true,
          order: selectedFunnelDefinition.order
        });
        setFunnelSteps(updated.steps.join(","));
        setMessage("Embudo actualizado.");
      } else {
        const created = await adminClient.createAnalyticsFunnelDefinition({
          key: slugifyFunnelKey(funnelDraftName),
          name: funnelDraftName,
          description: funnelDraftDescription || null,
          steps,
          visible: true,
          order: funnelDefinitions.length
        });
        setFunnelSteps(created.steps.join(","));
        setMessage("Embudo creado.");
      }
      await loadAnalytics();
    } catch {
      setMessage("No se pudo guardar el embudo.");
    } finally {
      setIsSavingFunnel(false);
    }
  }

  async function hideFunnelDefinition() {
    if (!selectedFunnelDefinition || !selectedFunnelIsPersisted) {
      setMessage("Selecciona un embudo guardado para ocultarlo.");
      return;
    }
    setIsSavingFunnel(true);
    try {
      await adminClient.deleteAnalyticsFunnelDefinition(selectedFunnelDefinition.id);
      selectFunnel(fallbackFunnelDefinitions[0].steps.join(","));
      await loadAnalytics();
      setMessage("Embudo ocultado.");
    } catch {
      setMessage("No se pudo ocultar el embudo.");
    } finally {
      setIsSavingFunnel(false);
    }
  }

  function selectGoal(id: string) {
    setSelectedGoalId(id);
    const goal = goals.find((item) => item.id === id);
    if (goal) {
      setGoalDraftName(goal.name);
      setGoalDraftDescription(goal.description || "");
      setGoalDraftEventType(goal.eventType);
      setGoalDraftEventTypes(normalizeGoalEventTypes(goal.eventTypes, goal.eventType));
      setGoalDraftTargetCount(String(goal.targetCount));
      setGoalDraftPeriod(goal.period);
    }
  }

  function resetGoalDraft() {
    setSelectedGoalId("");
    setGoalDraftName("");
    setGoalDraftDescription("");
    setGoalDraftEventType("landing_visit");
    setGoalDraftEventTypes(["landing_visit"]);
    setGoalDraftTargetCount("10");
    setGoalDraftPeriod("monthly");
  }

  function selectGoalPrimaryEvent(eventType: string) {
    setGoalDraftEventType(eventType);
    setGoalDraftEventTypes([eventType]);
  }

  function toggleGoalEventType(eventType: string, checked: boolean) {
    const nextEventTypes = checked
      ? normalizeGoalEventTypes([...goalDraftEventTypes, eventType], goalDraftEventType)
      : goalDraftEventTypes.filter((item) => item !== eventType);
    const normalized = normalizeGoalEventTypes(nextEventTypes, goalDraftEventType);
    setGoalDraftEventTypes(normalized);
    if (!normalized.includes(goalDraftEventType)) {
      setGoalDraftEventType(normalized[0]);
    }
  }

  async function saveGoal() {
    const targetCount = Number(goalDraftTargetCount);
    if (!goalDraftName.trim() || !Number.isFinite(targetCount) || targetCount < 1) {
      setMessage("El objetivo necesita nombre y meta numerica mayor que cero.");
      return;
    }

    setIsSavingGoal(true);
    try {
      const eventTypes = normalizeGoalEventTypes(goalDraftEventTypes, goalDraftEventType);
      const orderedEventTypes = [goalDraftEventType, ...eventTypes.filter((item) => item !== goalDraftEventType)];
      const mutation = {
        name: goalDraftName,
        description: goalDraftDescription || null,
        eventType: orderedEventTypes[0],
        eventTypes: orderedEventTypes,
        targetCount: Math.trunc(targetCount),
        period: goalDraftPeriod,
        visible: true,
        order: selectedGoal?.order ?? goals.length
      };
      if (selectedGoal) {
        await adminClient.updateAnalyticsGoal(selectedGoal.id, mutation);
        setMessage("Objetivo KPI actualizado.");
      } else {
        const created = await adminClient.createAnalyticsGoal({
          key: slugifyAnalyticsKey(goalDraftName),
          ...mutation
        });
        setSelectedGoalId(created.id);
        setMessage("Objetivo KPI creado.");
      }
      await loadAnalytics();
    } catch {
      setMessage("No se pudo guardar el objetivo KPI.");
    } finally {
      setIsSavingGoal(false);
    }
  }

  async function hideGoal() {
    if (!selectedGoal) {
      setMessage("Selecciona un objetivo guardado para ocultarlo.");
      return;
    }

    setIsSavingGoal(true);
    try {
      await adminClient.deleteAnalyticsGoal(selectedGoal.id);
      resetGoalDraft();
      await loadAnalytics();
      setMessage("Objetivo KPI ocultado.");
    } catch {
      setMessage("No se pudo ocultar el objetivo KPI.");
    } finally {
      setIsSavingGoal(false);
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
            <Button type="button" variant="outline" onClick={exportApiCsv}>
              <Download data-icon="inline-start" />
              CSV API
            </Button>
            <Button type="button" variant="outline" onClick={loadAnalytics} disabled={isLoading}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
              Actualizar
            </Button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:max-w-4xl lg:grid-cols-4">
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
          <div className="grid gap-2">
            <Label htmlFor="analyticsFunnelPreset">Embudo</Label>
            <select
              id="analyticsFunnelPreset"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              value={funnelSteps}
              onChange={(event) => selectFunnel(event.target.value)}
            >
              {funnelDefinitions.filter((definition) => definition.visible).map((definition) => (
                <option key={definition.id} value={definition.steps.join(",")}>{definition.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1.5fr_auto]">
          <div className="grid gap-2">
            <Label htmlFor="analyticsFunnelName">Nombre embudo</Label>
            <Input id="analyticsFunnelName" value={funnelDraftName} onChange={(event) => setFunnelDraftName(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsFunnelDescription">Descripcion</Label>
            <Input
              id="analyticsFunnelDescription"
              value={funnelDraftDescription}
              onChange={(event) => setFunnelDraftDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsFunnelSteps">Pasos CSV</Label>
            <Input
              id="analyticsFunnelSteps"
              value={funnelDraftSteps}
              onChange={(event) => setFunnelDraftSteps(event.target.value)}
              placeholder="landing_visit,project_view,contact_submit"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Button type="button" variant="outline" onClick={saveFunnelDefinition} disabled={isSavingFunnel}>
              {selectedFunnelIsPersisted ? "Guardar" : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={hideFunnelDefinition} disabled={isSavingFunnel || !selectedFunnelIsPersisted}>
              Ocultar
            </Button>
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
            <p className="font-mono text-sm text-primary">Objetivos KPI</p>
            <h2 className="mt-1 text-xl font-semibold">Metas persistentes</h2>
          </div>
          <Badge variant="outline">{goals.length} objetivos</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_140px_150px_auto]">
          <div className="grid gap-2">
            <Label htmlFor="analyticsGoalName">Nombre objetivo</Label>
            <Input id="analyticsGoalName" value={goalDraftName} onChange={(event) => setGoalDraftName(event.target.value)} placeholder="Descargas CV mensuales" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsGoalDescription">Descripcion</Label>
            <Input id="analyticsGoalDescription" value={goalDraftDescription} onChange={(event) => setGoalDraftDescription(event.target.value)} placeholder="sample/demo o criterio interno" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsGoalTarget">Meta</Label>
            <Input id="analyticsGoalTarget" type="number" min={1} value={goalDraftTargetCount} onChange={(event) => setGoalDraftTargetCount(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="analyticsGoalEventType">Evento principal</Label>
            <select
              id="analyticsGoalEventType"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              value={goalDraftEventType}
              onChange={(event) => selectGoalPrimaryEvent(event.target.value)}
            >
              {goalEventTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <select
              aria-label="Periodo objetivo KPI"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              value={goalDraftPeriod}
              onChange={(event) => setGoalDraftPeriod(event.target.value)}
            >
              {goalPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={saveGoal} disabled={isSavingGoal} aria-label={selectedGoal ? "Guardar objetivo KPI" : "Crear objetivo KPI"}>
              <Target data-icon="inline-start" />
              {selectedGoal ? "Guardar" : "Crear"}
            </Button>
            <Button type="button" variant="outline" onClick={resetGoalDraft} disabled={isSavingGoal} aria-label="Nuevo objetivo KPI">
              Nuevo
            </Button>
            <Button type="button" variant="outline" onClick={hideGoal} disabled={isSavingGoal || !selectedGoal} aria-label="Ocultar objetivo KPI">
              <Trash2 data-icon="inline-start" />
              Ocultar
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Eventos incluidos</Label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {goalEventTypeOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Checkbox
                  checked={goalDraftEventTypes.includes(option.value)}
                  onCheckedChange={(checked) => toggleGoalEventType(option.value, Boolean(checked))}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              className={`rounded-lg border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-primary ${selectedGoalId === goal.id ? "border-primary bg-primary/10" : "border-border"}`}
              onClick={() => selectGoal(goal.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{goal.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{goal.description || periodLabel(goal.period)}</p>
                </div>
                <Badge variant={goal.alertLevel === "success" ? "default" : "outline"}>{goal.achieved ? "cumplido" : goal.alertLevel}</Badge>
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold">{goal.count}</p>
                <p className="text-sm text-muted-foreground">meta {goal.targetCount} - {formatPercent(goal.progressRate)}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(goal.progressRate, 100)}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{goal.alertMessage}</p>
              <p className="mt-2 break-all text-xs text-muted-foreground">{normalizeGoalEventTypes(goal.eventTypes, goal.eventType).join(" + ")} - {periodLabel(goal.period)}</p>
            </button>
          ))}
          {goals.length ? null : (
            <p className="text-sm text-muted-foreground">Sin objetivos KPI definidos para analytics.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-primary">Embudo por canal</p>
            <h2 className="mt-1 text-xl font-semibold">Conversion multicanal</h2>
          </div>
          <Badge variant="outline">top 8</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(channelFunnel?.segments || []).map((segment) => (
            <div key={`${segment.source}-${segment.channel}`} className="rounded-lg border border-border p-4">
              <p className="break-all text-sm font-medium">{segment.source} / {segment.channel}</p>
              <p className="mt-2 text-sm text-muted-foreground">{segment.landingVisits} visitas landing</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>CV</span>
                  <span className="text-muted-foreground">{segment.cvDownloads} - {formatPercent(segment.cvDownloadRate)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Contacto</span>
                  <span className="text-muted-foreground">{segment.contactSubmits} - {formatPercent(segment.contactRate)}</span>
                </div>
              </div>
            </div>
          ))}
          {channelFunnel?.segments.length ? null : (
            <p className="text-sm text-muted-foreground">Sin datos multicanal para los filtros actuales.</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-primary">Embudo conversion</p>
            <h2 className="mt-1 text-xl font-semibold">{selectedFunnelLabel}</h2>
          </div>
          <Badge variant="outline">{selectedFunnelIsPersisted ? "guardado" : "base"}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(funnel?.steps || []).map((step) => (
            <div key={step.key} className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">{step.label}</p>
              <p className="mt-2 text-3xl font-semibold">{step.count}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatPercent(step.rateFromStart)} desde landing · {formatPercent(step.rateFromPrevious)} desde anterior
              </p>
            </div>
          ))}
          {funnel?.steps.length ? null : (
            <p className="text-sm text-muted-foreground">Sin datos de embudo para los filtros actuales.</p>
          )}
        </div>
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
          <Badge variant="outline">worker {privacy?.retentionWorkerEnabled ? "on" : "off"}</Badge>
          <Badge variant="outline">intervalo {privacy?.retentionWorkerIntervalMs ?? 86400000} ms</Badge>
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

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-primary">Roles objetivo CV</p>
            <h2 className="mt-1 text-xl font-semibold">Uso de adaptaciones</h2>
          </div>
          <Badge variant="outline">cv_adaptation</Badge>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <SegmentList title="Roles mas usados" items={labels?.labels || []} empty="Sin adaptaciones CV registradas." />
          <SegmentList title="Contextos" items={labels?.paths || []} empty="Sin rutas de adaptacion registradas." />
          <SegmentList title="Versiones base" items={labels?.contexts || []} empty="Sin contexto de versiones registrado." />
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

function formatPercent(value: number) {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })}%`;
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

function parseFunnelSteps(value: string) {
  return value
    .split(",")
    .map((step) => step.trim())
    .filter((step) => /^[a-z0-9_-]{1,80}$/.test(step))
    .slice(0, 6);
}

function slugifyFunnelKey(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `funnel-${Date.now()}`;
}

function slugifyAnalyticsKey(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `goal-${Date.now()}`;
}

function normalizeGoalEventTypes(eventTypes: string[] | undefined, fallback: string) {
  const source = eventTypes?.length ? eventTypes : [fallback];
  const normalized = Array.from(new Set(source.map((eventType) => eventType.trim()).filter(Boolean))).slice(0, 6);
  return normalized.length ? normalized : [fallback];
}

function periodLabel(period: string) {
  const labels: Record<string, string> = {
    daily: "diario",
    weekly: "semanal",
    monthly: "mensual",
    quarterly: "trimestral",
    custom: "personalizado"
  };
  return labels[period] || period;
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
            <span className="break-all font-medium">{item.name}</span>
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
