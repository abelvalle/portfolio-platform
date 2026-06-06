"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminClient, type PublicationThemeReview } from "@/lib/api";

export function PublicationReview() {
  const [review, setReview] = useState<PublicationThemeReview | null>(null);
  const [message, setMessage] = useState("Cargando revision de publicacion.");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    void loadReview();
  }, []);

  async function loadReview() {
    setIsLoading(true);
    try {
      const nextReview = await adminClient.publicationThemeReview();
      setReview(nextReview);
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

  const changedCount = review?.fields.filter((field) => field.changed).length ?? 0;

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">Draft / Publish</p>
            <h1 className="mt-2 text-3xl font-semibold">Revision de publicacion</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Primer workflow granular conectado a tema visual, ChangeLog y AuditLog.
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
            <span className="truncate text-muted-foreground">{field.before}</span>
            <span className="truncate text-muted-foreground">{field.after}</span>
            <span>{field.changed ? <Badge>cambio</Badge> : <Badge variant="outline">igual</Badge>}</span>
          </div>
        )) : (
          <div className="p-8 text-center text-sm text-muted-foreground">Sin revision disponible.</div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Ultimos cambios</h2>
        <div className="mt-4 grid gap-3">
          {review?.latestChanges.length ? review.latestChanges.map((change) => (
            <div key={change.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{change.summary}</p>
              <p className="mt-1 text-muted-foreground">{change.entityType} - {change.action}</p>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">Sin cambios registrados todavia.</p>
          )}
        </div>
      </section>
    </div>
  );
}
