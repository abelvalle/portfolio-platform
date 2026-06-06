"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit3, FileText, GitCompare, RefreshCw, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cvClient, type AuditLogItem, type CvCompareResult, type CvVersionItem } from "@/lib/api";

function joinList(items?: string[]) {
  return items?.length ? items.join(", ") : "Sin datos.";
}

function listDiff(base?: string[], adapted?: string[]) {
  const baseItems = base || [];
  const adaptedItems = adapted || [];
  return {
    common: adaptedItems.filter((item) => baseItems.includes(item)),
    added: adaptedItems.filter((item) => !baseItems.includes(item)),
    removed: baseItems.filter((item) => !adaptedItems.includes(item))
  };
}

function textDiff(base?: string, adapted?: string) {
  const baseWords = textTokens(base);
  const adaptedWords = textTokens(adapted);
  const baseSet = new Set(baseWords.map(normalizeWord));
  const adaptedSet = new Set(adaptedWords.map(normalizeWord));
  return {
    common: adaptedWords.filter((word) => baseSet.has(normalizeWord(word))),
    added: adaptedWords.filter((word) => !baseSet.has(normalizeWord(word))),
    removed: baseWords.filter((word) => !adaptedSet.has(normalizeWord(word)))
  };
}

function textTokens(value?: string) {
  return (value || "").split(/\s+/).map((word) => word.trim()).filter(Boolean);
}

function normalizeWord(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getInitialCompareIds() {
  if (typeof window === "undefined") {
    return { baseId: "", adaptedId: "" };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    baseId: params.get("baseId") || "",
    adaptedId: params.get("adaptedId") || ""
  };
}

export function CvCompareView() {
  const [versions, setVersions] = useState<CvVersionItem[]>([]);
  const [baseId, setBaseId] = useState("");
  const [adaptedId, setAdaptedId] = useState("");
  const [result, setResult] = useState<CvCompareResult | null>(null);
  const [message, setMessage] = useState("Cargando versiones.");
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publicationAudit, setPublicationAudit] = useState<AuditLogItem | null>(null);
  const adaptedVersion = versions.find((version) => version.id === adaptedId);

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
      const initialIds = getInitialCompareIds();
      setVersions(nextVersions);
      setBaseId((current) => current || initialIds.baseId || nextVersions[0]?.id || "");
      setAdaptedId((current) => current || initialIds.adaptedId || nextVersions[1]?.id || nextVersions[0]?.id || "");
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

  async function publishAdaptedVersion() {
    if (!adaptedId) {
      setMessage("Selecciona una version adaptada antes de publicar.");
      return;
    }

    setIsPublishing(true);
    try {
      await cvClient.setPrimaryVersion(adaptedId);
      await loadVersions();
      const auditLogs = await cvClient.versionAuditLog({
        action: "set_primary",
        resourceId: adaptedId,
        limit: "1"
      }).catch(() => []);
      setPublicationAudit(auditLogs[0] || null);
      setMessage("Version adaptada publicada como CV principal.");
    } catch {
      setMessage("No se pudo publicar la version adaptada.");
    } finally {
      setIsPublishing(false);
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

      {adaptedId ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-5">
          <div>
            <p className="font-mono text-xs text-primary">Revision</p>
            <h2 className="mt-1 text-lg font-semibold">Acciones sobre la version adaptada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {adaptedVersion ? `Seleccionada: ${adaptedVersion.name}.` : "Selecciona una version adaptada para revisar sus datos estructurados."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className={buttonVariants()} href={`/admin/cv/versions?versionId=${encodeURIComponent(adaptedId)}`}>
              <Edit3 data-icon="inline-start" />
              Editar JSON adaptado
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/admin/cv/editor">
              <FileText data-icon="inline-start" />
              Editar CV principal
            </Link>
            <Button type="button" variant="outline" onClick={publishAdaptedVersion} disabled={isPublishing}>
              <Star data-icon="inline-start" />
              {isPublishing ? "Publicando..." : "Publicar version adaptada"}
            </Button>
          </div>
          {publicationAudit ? (
            <div className="basis-full rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">Auditoria publicacion</p>
              <p className="mt-1 text-muted-foreground">
                {publicationAudit.action} | {publicationAudit.resourceId || "sin recurso"} | {new Date(publicationAudit.createdAt).toLocaleString()}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Resumen profesional", base: result?.summary?.base, adapted: result?.summary?.adapted, type: "text" },
          { title: "Orden de skills", base: joinList(result?.skillsOrder?.base), adapted: joinList(result?.skillsOrder?.adapted), type: "list", rawBase: result?.skillsOrder?.base, rawAdapted: result?.skillsOrder?.adapted },
          { title: "Experiencia destacada", base: joinList(result?.highlightedExperience?.base), adapted: joinList(result?.highlightedExperience?.adapted), type: "list", rawBase: result?.highlightedExperience?.base, rawAdapted: result?.highlightedExperience?.adapted },
          { title: "Orden de secciones", base: joinList(result?.sectionOrder?.base), adapted: joinList(result?.sectionOrder?.adapted), type: "list", rawBase: result?.sectionOrder?.base, rawAdapted: result?.sectionOrder?.adapted }
        ].map(({ title, base, adapted, type, rawBase, rawAdapted }) => {
          const changed = base !== adapted;
          const diff = type === "list" ? listDiff(rawBase, rawAdapted) : null;
          const inlineDiff = type === "text" && changed ? textDiff(base, adapted) : null;

          return (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{title}</span>
                <Badge variant={changed ? "default" : "outline"}>{changed ? "diferente" : "igual"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted-foreground">
              <div className={changed ? "rounded-lg border border-destructive/30 bg-destructive/5 p-3" : undefined}>
                <p className="font-medium text-foreground">Base</p>
                <p className="mt-1">{base || "Sin datos."}</p>
              </div>
              <div className={changed ? "rounded-lg border border-primary/30 bg-primary/5 p-3" : undefined}>
                <p className="font-medium text-foreground">Adaptado</p>
                <p className="mt-1">{adapted || "Sin datos."}</p>
              </div>
              {inlineDiff ? <TextDiffSummary common={inlineDiff.common} added={inlineDiff.added} removed={inlineDiff.removed} /> : null}
              {diff ? <ListDiffSummary common={diff.common} added={diff.added} removed={diff.removed} /> : null}
            </CardContent>
          </Card>
          );
        })}
      </section>
    </div>
  );
}

function TextDiffSummary({ common, added, removed }: { common: string[]; added: string[]; removed: string[] }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border p-3">
      <DiffGroup label="Palabras nuevas" items={added} variant="default" />
      <DiffGroup label="Palabras retiradas" items={removed} variant="destructive" />
      <DiffGroup label="Palabras comunes" items={common} variant="outline" />
    </div>
  );
}

function ListDiffSummary({ common, added, removed }: { common: string[]; added: string[]; removed: string[] }) {
  return (
    <div className="grid gap-3 rounded-lg border border-border p-3">
      <DiffGroup label="Solo en adaptado" items={added} variant="default" />
      <DiffGroup label="Solo en base" items={removed} variant="destructive" />
      <DiffGroup label="Comun" items={common} variant="outline" />
    </div>
  );
}

function DiffGroup({ label, items, variant }: { label: string; items: string[]; variant: "default" | "destructive" | "outline" }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.length ? items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>) : <span className="text-xs text-muted-foreground">Sin cambios.</span>}
      </div>
    </div>
  );
}
