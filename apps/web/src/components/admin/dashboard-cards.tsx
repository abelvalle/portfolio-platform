"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminClient, type AdminDashboard } from "@/lib/api";

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Sin fecha";
}

export function DashboardCards() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [message, setMessage] = useState("Cargando dashboard.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const cards = useMemo(() => {
    const values = dashboard?.cards;
    return [
      ["Visitas landing", values?.totalVisits ?? 0],
      ["Proyectos publicados", values?.publishedProjects ?? 0],
      ["Experiencias visibles", values?.visibleExperiences ?? 0],
      ["Mensajes recibidos", values?.receivedMessages ?? 0],
      ["CV principal activo", values?.primaryCv ?? "Sin CV principal"],
      ["Ultima actualizacion CV", formatDate(values?.cvUpdatedAt)]
    ];
  }, [dashboard]);

  async function loadDashboard() {
    setIsLoading(true);
    try {
      const nextDashboard = await adminClient.dashboard();
      setDashboard(nextDashboard);
      setMessage("Dashboard sincronizado con la API.");
    } catch {
      setMessage("No se pudo cargar el dashboard. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
        <Button type="button" variant="outline" onClick={loadDashboard} disabled={isLoading}>
          <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ultimos cambios</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard?.latestChanges.length ? dashboard.latestChanges.map((change) => (
              <div key={change.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{change.entityType}</Badge>
                  <Badge>{change.action}</Badge>
                </div>
                <p className="mt-2 font-medium">{change.summary}</p>
                <p className="mt-1 text-muted-foreground">{formatDate(change.createdAt)}</p>
              </div>
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
              <div key={module.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <div>
                  <p className="font-medium">{module.name}</p>
                  <p className="text-muted-foreground">{module.key}</p>
                </div>
                <Badge variant={module.enabled ? "default" : "secondary"}>{module.enabled ? "activo" : "inactivo"}</Badge>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Sin modulos registrados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
