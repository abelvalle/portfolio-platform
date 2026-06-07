"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminClient, type LinkedinIntegrationStatus } from "@/lib/api";

export function LinkedinSettings() {
  const [status, setStatus] = useState<LinkedinIntegrationStatus | null>(null);
  const [message, setMessage] = useState("Cargando estado LinkedIn.");
  const [isLoading, setIsLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextStatus = await adminClient.linkedinStatus();
      setStatus(nextStatus);
      setMessage("Estado LinkedIn sincronizado con la API.");
    } catch {
      setMessage("No se pudo cargar el estado LinkedIn.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Integracion LinkedIn</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status?.configured ? "default" : "secondary"}>
              {status?.configured ? "OAuth configurado" : "OAuth pendiente"}
            </Badge>
            <Badge variant={status?.connected ? "default" : "outline"}>
              {status?.connected ? "Cuenta sincronizada" : "Sin cuenta"}
            </Badge>
            <Button type="button" variant="outline" size="sm" onClick={loadStatus} disabled={isLoading}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-muted-foreground">
        <p>
          La API expone estado, URL de autorizacion OAuth opcional y URL de compartir portfolio. Si no hay credenciales
          LinkedIn, la landing conserva el enlace publico del perfil.
        </p>
        <div className="grid gap-2 rounded-lg border border-border p-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Share {status?.shareEnabled ? "on" : "off"}</Badge>
            <Badge variant="outline">Scopes {(status?.scopes || []).join(", ") || "sin datos"}</Badge>
          </div>
          <p>
            Perfil publico: {status?.profileUrl ? (
              <a className="text-primary hover:underline" href={status.profileUrl} target="_blank" rel="noreferrer">
                {status.profileUrl}
              </a>
            ) : "sin URL"}
          </p>
          <p>Ultima sincronizacion: {formatDate(status?.lastSyncedAt)}</p>
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">{message}</p>
        <DataTable rows={[
          { flujo: "Estado", endpoint: "GET /api/v1/integrations/linkedin/status", acceso: "publico" },
          { flujo: "Auth URL", endpoint: "GET /api/v1/integrations/linkedin/auth-url", acceso: "admin" },
          { flujo: "Callback", endpoint: "GET /api/v1/integrations/linkedin/callback", acceso: "admin" },
          { flujo: "Share URL", endpoint: "GET /api/v1/integrations/linkedin/share-url", acceso: "publico" }
        ]} />
      </CardContent>
    </Card>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "sin sincronizar";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
