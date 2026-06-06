"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminClient, type ChangeLogItem, type PublicationThemeReview } from "@/lib/api";

const restorableEntityTypes = new Set(["theme", "profile", "experience", "project", "skill", "education", "certification", "cv-version"]);

export function PublicationReview() {
  const [review, setReview] = useState<PublicationThemeReview | null>(null);
  const [changes, setChanges] = useState<ChangeLogItem[]>([]);
  const [message, setMessage] = useState("Cargando revision de publicacion.");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    void loadReview();
  }, []);

  async function loadReview() {
    setIsLoading(true);
    try {
      const [nextReview, nextChanges] = await Promise.all([
        adminClient.publicationThemeReview(),
        adminClient.changeLog()
      ]);
      setReview(nextReview);
      setChanges(nextChanges);
      setMessage(nextReview.hasDraft ? "Borrador pendiente de revision." : "No hay cambios pendientes.");
    } catch {
      setMessage("No se pudo cargar la revision. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function publishTheme() {
    setIsPublishing(true);
    try {
      const result = await adminClient.publishThemeDraft();
      setMessage(`Tema publicado. Campos modificados: ${result.changedFields.join(", ")}.`);
      await loadReview();
    } catch {
      setMessage("No se pudo publicar. Revisa que exista un borrador con cambios.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function restoreChange(id: string) {
    setRestoringId(id);
    try {
      const result = await adminClient.restorePublicationChange(id);
      setMessage(`Version restaurada. Campos modificados: ${result.changedFields.join(", ")}.`);
      await loadReview();
    } catch {
      setMessage("No se pudo restaurar este cambio.");
    } finally {
      setRestoringId(null);
    }
  }

  const changedCount = review?.fields.filter((field) => field.changed).length ?? 0;

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">Draft / Publish</p>
            <h1 className="mt-2 text-3xl font-semibold">Revision de publicacion</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Workflows granulares conectados a tema visual, perfil publico, ChangeLog y AuditLog.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={loadReview} disabled={isLoading}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
              Actualizar
            </Button>
            <Button type="button" onClick={publishTheme} disabled={!review?.hasDraft || isPublishing}>
              <Rocket data-icon="inline-start" />
              {isPublishing ? "Publicando..." : "Publicar tema"}
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant={review?.hasDraft ? "default" : "outline"}>{review?.hasDraft ? "draft pendiente" : "sin draft"}</Badge>
          <Badge variant="outline">{changedCount} cambios</Badge>
          {review?.publishedAt ? <Badge variant="outline">publicado {new Date(review.publishedAt).toLocaleDateString()}</Badge> : null}
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_1fr_1fr_100px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
          <span>Campo</span>
          <span>Publicado</span>
          <span>Borrador</span>
          <span>Estado</span>
        </div>
        {review?.fields.length ? review.fields.map((field) => (
          <div key={field.field} className="grid grid-cols-[1fr_1fr_1fr_100px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
            <span className="font-medium">{field.field}</span>
            <span className="truncate text-muted-foreground">{formatPublicationValue(field.before)}</span>
            <span className="truncate text-muted-foreground">{formatPublicationValue(field.after)}</span>
            <span>{field.changed ? <Badge>cambio</Badge> : <Badge variant="outline">igual</Badge>}</span>
          </div>
        )) : (
          <div className="p-8 text-center text-sm text-muted-foreground">Sin revision disponible.</div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Ultimos cambios</h2>
        <div className="mt-4 grid gap-3">
          {changes.length ? changes.map((change) => (
            <div key={change.id} className="grid gap-3 rounded-lg border border-border p-3 text-sm md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="font-medium">{change.summary}</p>
                <p className="mt-1 text-muted-foreground">{change.entityType} - {change.action}</p>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {publicationEntityHref(change) ? (
                  <Link
                    href={publicationEntityHref(change) as string}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-[0.8rem] font-medium transition-colors hover:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-3.5"
                  >
                    <ExternalLink data-icon="inline-start" />
                    Abrir {entityLabel(change.entityType)}
                  </Link>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => restoreChange(change.id)}
                  disabled={!restorableEntityTypes.has(change.entityType) || restoringId === change.id}
                >
                  {restoringId === change.id ? "Restaurando..." : "Restaurar"}
                </Button>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Sin cambios registrados todavia.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function formatPublicationValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function entityLabel(entityType: string) {
  const labels: Record<string, string> = {
    theme: "tema",
    profile: "perfil",
    experience: "experiencia",
    project: "proyecto",
    skill: "skill",
    education: "estudio",
    certification: "certificacion",
    "cv-version": "version CV"
  };
  return labels[entityType] || "entidad";
}

function publicationEntityHref(change: ChangeLogItem) {
  const queryId = encodeURIComponent(change.entityId || "");
  const routes: Record<string, string> = {
    theme: "/admin/portfolio/theme",
    profile: "/admin/portfolio",
    experience: queryId ? `/admin/portfolio/experience?experienceId=${queryId}` : "/admin/portfolio/experience",
    project: queryId ? `/admin/portfolio/projects?projectId=${queryId}` : "/admin/portfolio/projects",
    skill: queryId ? `/admin/portfolio/skills?skillId=${queryId}` : "/admin/portfolio/skills",
    education: queryId ? `/admin/portfolio/education?educationId=${queryId}` : "/admin/portfolio/education",
    certification: queryId ? `/admin/portfolio/certifications?certificationId=${queryId}` : "/admin/portfolio/certifications",
    "cv-version": queryId ? `/admin/cv/versions?versionId=${queryId}` : "/admin/cv/versions"
  };
  return routes[change.entityType] || null;
}
