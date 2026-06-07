"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Rocket, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicationHistoryLink } from "@/components/admin/publication-history-link";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, mediaClient, type MediaAsset, type ProfileSettings, type PublicationProfileReview } from "@/lib/api";

const profileFields = [
  { key: "fullName", label: "Nombre completo" },
  { key: "headline", label: "Titular profesional" },
  { key: "subtitle", label: "Subtitulo" },
  { key: "shortBio", label: "Bio corta", textarea: true },
  { key: "longBio", label: "Bio larga", textarea: true },
  { key: "location", label: "Ubicacion" },
  { key: "availability", label: "Disponibilidad" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefono" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "github", label: "GitHub" },
  { key: "website", label: "Web" },
  { key: "avatarUrl", label: "Avatar URL" },
  { key: "cvUrl", label: "CV URL" },
  { key: "seoTitle", label: "SEO title" },
  { key: "seoDescription", label: "SEO description", textarea: true },
  { key: "ogImageUrl", label: "Open Graph image" },
  { key: "primaryLanguage", label: "Idioma principal" },
  { key: "ctaPrimary", label: "CTA principal" },
  { key: "ctaSecondary", label: "CTA secundario" }
] as const;

type ProfileFieldKey = (typeof profileFields)[number]["key"];
type ProfileForm = Record<ProfileFieldKey, string>;

const nullableFields = new Set<ProfileFieldKey>([
  "phone",
  "linkedin",
  "github",
  "website",
  "avatarUrl",
  "cvUrl",
  "seoTitle",
  "seoDescription",
  "ogImageUrl"
]);

function emptyForm(): ProfileForm {
  return profileFields.reduce((form, field) => {
    form[field.key] = "";
    return form;
  }, {} as ProfileForm);
}

function formFromProfile(profile: ProfileSettings | null, review: PublicationProfileReview | null): ProfileForm {
  const next = emptyForm();
  for (const field of profileFields) {
    const reviewed = review?.fields.find((item) => item.field === field.key);
    const value = reviewed ? reviewed.after : profile?.[field.key];
    next[field.key] = typeof value === "string" ? value : "";
  }
  return next;
}

function draftFromForm(form: ProfileForm) {
  return profileFields.reduce<Record<string, string | null>>((draft, field) => {
    const value = form[field.key].trim();
    draft[field.key] = nullableFields.has(field.key) && !value ? null : value;
    return draft;
  }, {});
}

function mediaAssetLabel(asset: MediaAsset) {
  return asset.originalName || asset.filename;
}

export function ProfileEditor() {
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [review, setReview] = useState<PublicationProfileReview | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [form, setForm] = useState<ProfileForm>(() => emptyForm());
  const [message, setMessage] = useState("Cargando perfil.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const changedCount = useMemo(() => review?.fields.filter((field) => field.changed).length ?? 0, [review]);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const [nextProfile, nextReview, nextMediaAssets] = await Promise.all([
        adminClient.profile(),
        adminClient.publicationProfileReview(),
        mediaClient.list()
      ]);
      setProfile(nextProfile);
      setReview(nextReview);
      setMediaAssets(nextMediaAssets);
      setForm(formFromProfile(nextProfile, nextReview));
      setMessage(nextReview.hasDraft ? "Borrador de perfil pendiente de revision." : "Perfil sincronizado.");
    } catch {
      setMessage("No se pudo cargar el perfil. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveDraft() {
    setIsSaving(true);
    try {
      await adminClient.updateProfile({ draftJson: draftFromForm(form) });
      const nextReview = await adminClient.publicationProfileReview();
      setReview(nextReview);
      setMessage("Borrador de perfil guardado.");
    } catch {
      setMessage("No se pudo guardar el borrador del perfil.");
    } finally {
      setIsSaving(false);
    }
  }

  async function publishProfile() {
    setIsPublishing(true);
    try {
      const result = await adminClient.publishProfileDraft();
      setMessage(`Perfil publicado. Campos modificados: ${result.changedFields.join(", ")}.`);
      await loadProfile();
    } catch {
      setMessage("No se pudo publicar. Revisa que exista un borrador con cambios.");
    } finally {
      setIsPublishing(false);
    }
  }

  const imageAssets = mediaAssets.filter((asset) => asset.mimeType.startsWith("image/"));

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">Portfolio CMS</p>
            <h1 className="mt-2 text-3xl font-semibold">Perfil publico</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Edita el contenido principal de la landing como borrador antes de publicarlo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PublicationHistoryLink />
            <Button type="button" variant="outline" onClick={loadProfile} disabled={isLoading}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
              Actualizar
            </Button>
            <Button type="button" variant="outline" onClick={saveDraft} disabled={isSaving}>
              <Save data-icon="inline-start" />
              {isSaving ? "Guardando..." : "Guardar borrador"}
            </Button>
            <Button type="button" onClick={publishProfile} disabled={!review?.hasDraft || isPublishing}>
              <Rocket data-icon="inline-start" />
              {isPublishing ? "Publicando..." : "Publicar perfil"}
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant={review?.hasDraft ? "default" : "outline"}>{review?.hasDraft ? "draft pendiente" : "sin draft"}</Badge>
          <Badge variant="outline">{changedCount} cambios</Badge>
          {profile?.publishedAt ? <Badge variant="outline">publicado {new Date(profile.publishedAt).toLocaleDateString()}</Badge> : null}
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 lg:grid-cols-2">
        {profileFields.map((field) => {
          const isTextarea = "textarea" in field && field.textarea;
          const mediaLabel = field.key === "avatarUrl" ? "Avatar media" : field.key === "ogImageUrl" ? "Open Graph media" : null;
          const mediaValue = imageAssets.some((asset) => asset.url === form[field.key]) ? form[field.key] : "";
          return (
            <div className={isTextarea ? "grid gap-2 lg:col-span-2" : "grid gap-2"} key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              {isTextarea ? (
                <Textarea
                  id={field.key}
                  value={form[field.key]}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  rows={field.key === "longBio" ? 6 : 4}
                />
              ) : (
                <Input
                  id={field.key}
                  value={form[field.key]}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                />
              )}
              {mediaLabel ? (
                <>
                  <Label htmlFor={`${field.key}Media`}>{mediaLabel}</Label>
                  <select
                    id={`${field.key}Media`}
                    className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                    value={mediaValue}
                    onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  >
                    <option value="">{imageAssets.length ? "Seleccionar imagen" : "Sin imagenes en media"}</option>
                    {imageAssets.map((asset) => (
                      <option key={asset.id} value={asset.url}>{mediaAssetLabel(asset)}</option>
                    ))}
                  </select>
                </>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[180px_1fr_1fr_100px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Campo</span>
            <span>Publicado</span>
            <span>Borrador</span>
            <span>Estado</span>
          </div>
          {review?.fields.length ? review.fields.map((field) => (
            <div key={field.field} className="grid grid-cols-[180px_1fr_1fr_100px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-medium">{field.field}</span>
              <span className="truncate text-muted-foreground">{formatPublicationValue(field.before)}</span>
              <span className="truncate text-muted-foreground">{formatPublicationValue(field.after)}</span>
              <span>{field.changed ? <Badge>cambio</Badge> : <Badge variant="outline">igual</Badge>}</span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin revision disponible.</div>
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
