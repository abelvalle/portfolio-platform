"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClient, type AdminDashboard } from "@/lib/api";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Sin fecha";
}

export function DashboardCards() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [message, setMessage] = useState("Cargando dashboard.");
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextDashboard = await adminClient.dashboard({
        from: fromDate || undefined,
        to: toDate || undefined
      });
      setDashboard(nextDashboard);
      setMessage("Dashboard sincronizado con filtros de API.");
    } catch {
      setMessage("No se pudo cargar el dashboard. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }, [fromDate, toDate]);

  const cards = useMemo(() => {
    const values = dashboard?.cards;
    return [
      { label: "Visitas landing", value: values?.totalVisits ?? 0, href: "/admin/analytics", action: "Ver eventos" },
      { label: "Proyectos publicados", value: values?.publishedProjects ?? 0, href: "/admin/portfolio/projects", action: "Gestionar proyectos" },
      { label: "Experiencias visibles", value: values?.visibleExperiences ?? 0, href: "/admin/portfolio/experience", action: "Gestionar experiencia" },
      { label: "Mensajes recibidos", value: values?.receivedMessages ?? 0, href: "/admin/messages", action: "Abrir bandeja" },
      { label: "CV principal activo", value: values?.primaryCv ?? "Sin CV principal", href: "/admin/cv", action: "Abrir CV Manager" },
      { label: "Ultima actualizacion CV", value: formatDate(values?.cvUpdatedAt), href: "/admin/cv/versions", action: "Ver versiones" }
    ];
  }, [dashboard]);
  const operationalPulse = useMemo(() => buildOperationalPulse(dashboard), [dashboard]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="dashboardFromDate">Desde</Label>
            <Input id="dashboardFromDate" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dashboardToDate">Hasta</Label>
            <Input id="dashboardToDate" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
          <Button type="button" variant="outline" onClick={loadDashboard} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Card className="h-full transition-colors hover:ring-primary/50">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{card.value}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                  {card.action}
                  <ArrowRight className="size-4" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pulso operativo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {operationalPulse.map((item) => (
            <div key={item.label} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <Badge variant="outline">{item.value}</Badge>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ultimos cambios</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard?.latestChanges.length ? dashboard.latestChanges.map((change) => (
              <Link key={change.id} href="/admin/settings/publication" className="rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/60">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{change.entityType}</Badge>
                  <Badge>{change.action}</Badge>
                </div>
                <p className="mt-2 font-medium">{change.summary}</p>
                <p className="mt-1 text-muted-foreground">{formatDate(change.createdAt)}</p>
              </Link>
            )) : (
              <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modulos activos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {dashboard?.modules.length ? dashboard.modules.map((module) => (
              <ModuleRow key={module.id} module={module} />
            )) : (
              <p className="text-sm text-muted-foreground">Sin modulos registrados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ModuleRow({ module }: { module: AdminDashboard["modules"][number] }) {
  const href = moduleHref(module.key);
  const content = (
    <>
      <div>
        <p className="font-medium">{module.name}</p>
        <p className="text-muted-foreground">{module.key}</p>
      </div>
      <Badge variant={module.enabled ? "default" : "secondary"}>{module.enabled ? "activo" : "inactivo"}</Badge>
    </>
  );

  if (!href) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary/60">
      {content}
    </Link>
  );
}

function buildOperationalPulse(dashboard: AdminDashboard | null) {
  const visits = dashboard?.cards.totalVisits ?? 0;
  const messages = dashboard?.cards.receivedMessages ?? 0;
  const projects = dashboard?.cards.publishedProjects ?? 0;
  const experiences = dashboard?.cards.visibleExperiences ?? 0;
  const modules = dashboard?.modules ?? [];
  const activeModules = modules.filter((module) => module.enabled).length;

  return [
    {
      label: "Conversion contacto",
      value: `${percent(messages, visits)}%`,
      percent: percent(messages, visits),
      detail: `${messages} mensajes sobre ${visits} visitas`
    },
    {
      label: "Contenido visible",
      value: String(projects + experiences),
      percent: Math.min((projects + experiences) * 10, 100),
      detail: `${projects} proyectos y ${experiences} experiencias`
    },
    {
      label: "Modulos activos",
      value: `${activeModules}/${modules.length}`,
      percent: percent(activeModules, modules.length),
      detail: "Cobertura de modulos habilitados"
    }
  ];
}

function percent(value: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

function moduleHref(key: string) {
  const routes: Record<string, string> = {
    dashboard: "/admin",
    portfolio: "/admin/portfolio",
    "cv-manager": "/admin/cv",
    projects: "/admin/portfolio/projects",
    messages: "/admin/messages",
    analytics: "/admin/analytics",
    media: "/admin/media",
    settings: "/admin/settings"
  };
  return routes[key] || null;
}
