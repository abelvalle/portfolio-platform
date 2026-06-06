"use client";

import { useEffect, useState } from "react";
import { GitCompare, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cvClient, type CvCompareResult, type CvVersionItem } from "@/lib/api";

function joinList(items?: string[]) {
  return items?.length ? items.join(", ") : "Sin datos.";
}

export function CvCompareView() {
  const [versions, setVersions] = useState<CvVersionItem[]>([]);
  const [baseId, setBaseId] = useState("");
  const [adaptedId, setAdaptedId] = useState("");
  const [result, setResult] = useState<CvCompareResult | null>(null);
  const [message, setMessage] = useState("Cargando versiones.");
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVersions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadVersions() {
    setIsLoading(true);
    try {
      const nextVersions = await cvClient.versions();
      setVersions(nextVersions);
      setBaseId((current) => current || nextVersions[0]?.id || "");
      setAdaptedId((current) => current || nextVersions[1]?.id || nextVersions[0]?.id || "");
      setMessage(nextVersions.length ? "Selecciona versiones para comparar." : "Sin versiones disponibles.");
    } catch {
      setMessage("No se pudieron cargar versiones. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function compareVersions() {
    if (!baseId || !adaptedId) {
      setMessage("Selecciona CV base y CV adaptado.");
      return;
    }

    setIsComparing(true);
    try {
      const nextResult = await cvClient.compare(baseId, adaptedId);
      setResult(nextResult);
      setMessage("Comparacion generada desde la API.");
    } catch {
      setMessage("No se pudo comparar estas versiones.");
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">CV Manager</p>
            <h1 className="mt-2 text-3xl font-semibold">Comparar CV</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Compara resumen, skills, experiencias destacadas y orden de secciones.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadVersions} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Versiones
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {([
          ["CV base", baseId, setBaseId],
          ["CV adaptado", adaptedId, setAdaptedId]
        ] as const).map(([title, selectedId, setSelectedId]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {versions.length ? versions.map((version) => (
                <Button
                  key={version.id}
                  type="button"
                  variant={selectedId === version.id ? "default" : "outline"}
                  onClick={() => setSelectedId(version.id)}
                >
                  {version.name}
                </Button>
              )) : (
                <p className="text-sm text-muted-foreground">Sin versiones.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <Button type="button" onClick={compareVersions} disabled={isComparing}>
        <GitCompare data-icon="inline-start" />
        {isComparing ? "Comparando..." : "Comparar versiones"}
      </Button>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          ["Resumen profesional", result?.summary?.base, result?.summary?.adapted],
          ["Orden de skills", joinList(result?.skillsOrder?.base), joinList(result?.skillsOrder?.adapted)],
          ["Experiencia destacada", joinList(result?.highlightedExperience?.base), joinList(result?.highlightedExperience?.adapted)],
          ["Orden de secciones", joinList(result?.sectionOrder?.base), joinList(result?.sectionOrder?.adapted)]
        ].map(([title, base, adapted]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{title}</span>
                <Badge variant={base === adapted ? "outline" : "default"}>{base === adapted ? "igual" : "diferente"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Base</p>
                <p className="mt-1">{base || "Sin datos."}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Adaptado</p>
                <p className="mt-1">{adapted || "Sin datos."}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
