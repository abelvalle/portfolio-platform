"use client";

import { useEffect, useState } from "react";
import { Archive, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, type CvVersionItem, type CvVersionMutation } from "@/lib/api";

type CvVersionDraft = {
  name: string;
  description: string;
  targetRole: string;
  targetCompany: string;
  language: string;
  status: "draft" | "published" | "archived";
};

const emptyDraft: CvVersionDraft = {
  name: "",
  description: "",
  targetRole: "",
  targetCompany: "",
  language: "es",
  status: "draft"
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CvVersionTable() {
  const [versions, setVersions] = useState<CvVersionItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando versiones de CV.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      setMessage(nextVersions.length ? "Versiones sincronizadas con la API." : "Sin versiones registradas.");
    } catch {
      setMessage("No se pudieron cargar versiones. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  function buildMutation(cvId: string): CvVersionMutation {
    return {
      cvId,
      name: draft.name.trim(),
      slug: slugify(draft.name.trim()),
      description: draft.description.trim() || null,
      targetRole: draft.targetRole.trim(),
      targetCompany: draft.targetCompany.trim() || null,
      language: draft.language.trim() || "es",
      status: draft.status,
      structuredJson: {}
    };
  }

  async function createVersion() {
    const baseCvId = versions[0]?.cvId;
    if (!baseCvId) {
      setMessage("Necesitas un CV base existente para crear versiones.");
      return;
    }

    const payload = buildMutation(baseCvId);
    if (!payload.name || !payload.slug || !payload.targetRole) {
      setMessage("Nombre y puesto objetivo son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await cvClient.createVersion(payload);
      setDraft(emptyDraft);
      setMessage("Version creada.");
      await loadVersions();
    } catch {
      setMessage("No se pudo crear la version.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchVersion(id: string, data: Partial<CvVersionMutation>) {
    setBusyId(id);
    try {
      await cvClient.updateVersion(id, data);
      setMessage("Version actualizada.");
      await loadVersions();
    } catch {
      setMessage("No se pudo actualizar la version.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteVersion(id: string) {
    setBusyId(id);
    try {
      await cvClient.deleteVersion(id);
      setMessage("Version archivada.");
      await loadVersions();
    } catch {
      setMessage("No se pudo archivar la version.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">CV Manager</p>
            <h1 className="mt-2 text-3xl font-semibold">Versiones de CV</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Versiones reales desde la API para CV general, roles objetivo y adaptaciones.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadVersions} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="cvVersionName">Nombre</Label>
          <Input id="cvVersionName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="targetRole">Puesto objetivo</Label>
          <Input id="targetRole" value={draft.targetRole} onChange={(event) => setDraft((current) => ({ ...current, targetRole: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Idioma</Label>
          <Input id="language" value={draft.language} onChange={(event) => setDraft((current) => ({ ...current, language: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="targetCompany">Empresa objetivo</Label>
          <Input id="targetCompany" value={draft.targetCompany} onChange={(event) => setDraft((current) => ({ ...current, targetCompany: event.target.value }))} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="versionDescription">Descripcion</Label>
          <Textarea id="versionDescription" rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          {(["draft", "published", "archived"] as const).map((status) => (
            <Button key={status} type="button" variant={draft.status === status ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, status }))}>
              {status}
            </Button>
          ))}
          <Button type="button" onClick={createVersion} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Crear version"}
          </Button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.2fr_1fr_100px_130px_120px_150px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Nombre</span>
            <span>Objetivo</span>
            <span>Idioma</span>
            <span>Estado</span>
            <span>Principal</span>
            <span>Acciones</span>
          </div>
          {versions.length ? versions.map((version) => (
            <div key={version.id} className="grid grid-cols-[1.2fr_1fr_100px_130px_120px_150px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span>
                <span className="block font-medium">{version.name}</span>
                <span className="block text-muted-foreground">{version.slug}</span>
              </span>
              <span className="text-muted-foreground">{version.targetRole}</span>
              <span className="text-muted-foreground">{version.language}</span>
              <span><Badge variant={version.status === "published" ? "default" : "secondary"}>{version.status}</Badge></span>
              <span>{version.isPrimary ? <Badge>principal</Badge> : <Badge variant="outline">no</Badge>}</span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => patchVersion(version.id, { status: version.status === "published" ? "archived" : "published" })} disabled={busyId === version.id}>
                  <Archive />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => deleteVersion(version.id)} disabled={busyId === version.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin versiones registradas.</div>
          )}
        </div>
      </section>
    </div>
  );
}
