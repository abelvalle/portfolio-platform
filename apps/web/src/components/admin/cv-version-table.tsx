"use client";

import { useCallback, useEffect, useState } from "react";
import { Archive, FileText, RefreshCw, Save, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, getApiUrl, type CvTemplateItem, type CvVersionItem, type CvVersionMutation } from "@/lib/api";

type CvVersionDraft = {
  name: string;
  description: string;
  targetRole: string;
  targetCompany: string;
  language: string;
  status: "draft" | "published" | "archived";
  templateId: string;
};

const emptyDraft: CvVersionDraft = {
  name: "",
  description: "",
  targetRole: "",
  targetCompany: "",
  language: "es",
  status: "draft",
  templateId: ""
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatJson(value: unknown) {
  return JSON.stringify(value || {}, null, 2);
}

function getInitialVersionId() {
  if (typeof window === "undefined") {
    return "";
  }
  return new URLSearchParams(window.location.search).get("versionId") || "";
}

function validateStructuredJson(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "JSON estructurado debe ser un objeto raiz.";
  }

  const data = value as Record<string, unknown>;
  const arrayFields = ["experience", "education", "certifications", "skills", "projects", "languages", "sections"];
  for (const field of arrayFields) {
    if (field in data && !Array.isArray(data[field])) {
      return `El campo ${field} debe ser una lista.`;
    }
  }
  if ("personal" in data && (typeof data.personal !== "object" || Array.isArray(data.personal))) {
    return "El campo personal debe ser un objeto.";
  }

  return "";
}

function isLargeJsonChange(previousValue: unknown, nextValue: unknown) {
  const previousJson = formatJson(previousValue);
  const nextJson = formatJson(nextValue);

  return nextJson.length > 1500 || Math.abs(nextJson.length - previousJson.length) > 250;
}

export function CvVersionTable() {
  const [versions, setVersions] = useState<CvVersionItem[]>([]);
  const [templates, setTemplates] = useState<CvTemplateItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando versiones de CV.");
  const [jsonVersionId, setJsonVersionId] = useState("");
  const [jsonDraft, setJsonDraft] = useState("{}");
  const [jsonMessage, setJsonMessage] = useState("Selecciona una version para editar su JSON estructurado.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isJsonSaving, setIsJsonSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingArchiveVersion, setPendingArchiveVersion] = useState<CvVersionItem | null>(null);
  const [pendingJsonSave, setPendingJsonSave] = useState<{ version: CvVersionItem; structuredJson: unknown } | null>(null);

  const syncJsonEditor = useCallback((nextVersions: CvVersionItem[]) => {
    const requestedVersionId = getInitialVersionId();
    const preferredId = jsonVersionId || requestedVersionId;
    const selectedVersion = nextVersions.find((version) => version.id === preferredId) || nextVersions[0];
    if (!selectedVersion) {
      setJsonVersionId("");
      setJsonDraft("{}");
      setJsonMessage("Sin versiones disponibles para editar.");
      return;
    }
    if (!jsonVersionId || selectedVersion.id !== jsonVersionId) {
      setJsonVersionId(selectedVersion.id);
      setJsonDraft(formatJson(selectedVersion.structuredJson));
      setJsonMessage(
        requestedVersionId === selectedVersion.id
          ? "Version enlazada desde el comparador cargada para edicion."
          : "JSON estructurado cargado desde la API."
      );
    }
  }, [jsonVersionId]);

  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextVersions, nextTemplates] = await Promise.all([
        cvClient.versions(),
        cvClient.templates().catch(() => [])
      ]);
      setVersions(nextVersions);
      setTemplates(nextTemplates);
      syncJsonEditor(nextVersions);
      setMessage(nextVersions.length ? "Versiones y plantillas sincronizadas con la API." : "Sin versiones registradas.");
    } catch {
      setMessage("No se pudieron cargar versiones. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }, [syncJsonEditor]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVersions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVersions]);

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
      templateId: draft.templateId || null,
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

  async function deleteVersion(version: CvVersionItem) {
    setBusyId(version.id);
    try {
      await cvClient.deleteVersion(version.id);
      setPendingArchiveVersion(null);
      setMessage(`Version archivada: ${version.name}.`);
      await loadVersions();
    } catch {
      setMessage("No se pudo archivar la version.");
    } finally {
      setBusyId(null);
    }
  }

  async function generateVersionFile(id: string, type: "pdf" | "docx") {
    setBusyId(id);
    setMessage(`Generando ${type.toUpperCase()} de la version seleccionada.`);
    try {
      if (type === "pdf") {
        await cvClient.generateVersionPdf(id);
      } else {
        await cvClient.generateVersionDocx(id);
      }
      setMessage(`${type.toUpperCase()} generado y registrado como asset de media.`);
      await loadVersions();
    } catch {
      setMessage(`No se pudo generar el ${type.toUpperCase()} de esta version.`);
    } finally {
      setBusyId(null);
    }
  }

  async function setPrimaryVersion(id: string) {
    setBusyId(id);
    setMessage("Marcando version principal.");
    try {
      await cvClient.setPrimaryVersion(id);
      setMessage("Version principal actualizada.");
      await loadVersions();
    } catch {
      setMessage("No se pudo marcar esta version como principal.");
    } finally {
      setBusyId(null);
    }
  }

  function selectJsonVersion(id: string) {
    const selectedVersion = versions.find((version) => version.id === id);
    setJsonVersionId(id);
    setJsonDraft(formatJson(selectedVersion?.structuredJson));
    setJsonMessage(selectedVersion ? "JSON estructurado cargado desde la version seleccionada." : "Version no encontrada.");
  }

  async function saveStructuredJson() {
    const selectedVersion = versions.find((version) => version.id === jsonVersionId);
    if (!selectedVersion) {
      setJsonMessage("Selecciona una version valida antes de guardar.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonDraft);
    } catch {
      setJsonMessage("JSON invalido. Revisa comas, llaves y comillas.");
      return;
    }
    const validationMessage = validateStructuredJson(parsed);
    if (validationMessage) {
      setJsonMessage(validationMessage);
      return;
    }

    if (isLargeJsonChange(selectedVersion.structuredJson, parsed)) {
      setPendingJsonSave({ version: selectedVersion, structuredJson: parsed });
      setJsonMessage("Cambio grande detectado. Confirma antes de guardar.");
      return;
    }

    await persistStructuredJson(selectedVersion, parsed);
  }

  async function persistStructuredJson(selectedVersion: CvVersionItem, structuredJson: unknown) {
    setIsJsonSaving(true);
    try {
      await cvClient.updateVersion(selectedVersion.id, { structuredJson });
      setPendingJsonSave(null);
      setJsonMessage("JSON estructurado guardado.");
      await loadVersions();
    } catch {
      setJsonMessage("No se pudo guardar el JSON estructurado.");
    } finally {
      setIsJsonSaving(false);
    }
  }

  function templateLabel(templateId?: string | null) {
    if (!templateId) {
      return "Sin plantilla";
    }
    return templates.find((template) => template.id === templateId)?.name || "Plantilla asignada";
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

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-4">
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
          <Label htmlFor="templateId">Plantilla</Label>
          <select
            id="templateId"
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={draft.templateId}
            onChange={(event) => setDraft((current) => ({ ...current, templateId: event.target.value }))}
          >
            <option value="">Sin plantilla</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="targetCompany">Empresa objetivo</Label>
          <Input id="targetCompany" value={draft.targetCompany} onChange={(event) => setDraft((current) => ({ ...current, targetCompany: event.target.value }))} />
        </div>
        <div className="grid gap-2 md:col-span-3">
          <Label htmlFor="versionDescription">Descripcion</Label>
          <Textarea id="versionDescription" rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-4">
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

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="grid min-w-[260px] gap-2">
            <Label htmlFor="structuredJsonVersion">Version</Label>
            <select
              id="structuredJsonVersion"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              value={jsonVersionId}
              onChange={(event) => selectJsonVersion(event.target.value)}
            >
              {versions.map((version) => (
                <option key={version.id} value={version.id}>{version.name}</option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={saveStructuredJson} disabled={isJsonSaving || !jsonVersionId}>
            <Save data-icon="inline-start" />
            {isJsonSaving ? "Guardando JSON..." : "Guardar JSON"}
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="structuredJson">JSON estructurado</Label>
          <Textarea
            id="structuredJson"
            rows={10}
            className="font-mono text-xs"
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{jsonMessage}</p>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[1100px]">
          <div className="grid grid-cols-[1.1fr_1fr_90px_120px_110px_390px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Nombre</span>
            <span>Objetivo</span>
            <span>Idioma</span>
            <span>Estado</span>
            <span>Principal</span>
            <span>Acciones</span>
          </div>
          {versions.length ? versions.map((version) => (
            <div key={version.id} className="grid grid-cols-[1.1fr_1fr_90px_120px_110px_390px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span>
                <span className="block font-medium">{version.name}</span>
                <span className="block text-muted-foreground">{version.slug}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{templateLabel(version.templateId)}</span>
                <span className="mt-2 flex flex-wrap gap-1">
                  {version.generatedPdfId ? <Badge variant="outline">PDF listo</Badge> : null}
                  {version.generatedDocxId ? <Badge variant="outline">DOCX listo</Badge> : null}
                </span>
                <span className="mt-2 flex flex-wrap gap-3 text-xs">
                  {version.generatedPdfId ? <a className="text-primary hover:underline" href={getApiUrl(`/media/${version.generatedPdfId}/download`)}>Descargar PDF</a> : null}
                  {version.generatedDocxId ? <a className="text-primary hover:underline" href={getApiUrl(`/media/${version.generatedDocxId}/download`)}>Descargar DOCX</a> : null}
                </span>
              </span>
              <span className="text-muted-foreground">{version.targetRole}</span>
              <span className="text-muted-foreground">{version.language}</span>
              <span><Badge variant={version.status === "published" ? "default" : "secondary"}>{version.status}</Badge></span>
              <span>{version.isPrimary ? <Badge>principal</Badge> : <Badge variant="outline">no</Badge>}</span>
              <span className="flex flex-wrap gap-1">
                <label className="sr-only" htmlFor={`template-${version.id}`}>Plantilla de {version.name}</label>
                <select
                  id={`template-${version.id}`}
                  className="h-7 max-w-[150px] rounded-lg border border-input bg-transparent px-2 text-xs"
                  value={version.templateId || ""}
                  onChange={(event) => patchVersion(version.id, { templateId: event.target.value || null })}
                  disabled={busyId === version.id}
                >
                  <option value="">Sin plantilla</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => generateVersionFile(version.id, "pdf")} disabled={busyId === version.id}>
                  <FileText data-icon="inline-start" />
                  PDF
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => generateVersionFile(version.id, "docx")} disabled={busyId === version.id}>
                  <FileText data-icon="inline-start" />
                  DOCX
                </Button>
                {!version.isPrimary ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setPrimaryVersion(version.id)} disabled={busyId === version.id}>
                    <Star data-icon="inline-start" />
                    Principal
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="icon" aria-label="Cambiar estado" onClick={() => patchVersion(version.id, { status: version.status === "published" ? "archived" : "published" })} disabled={busyId === version.id}>
                  <Archive />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Archivar ${version.name}`} onClick={() => setPendingArchiveVersion(version)} disabled={busyId === version.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin versiones registradas.</div>
          )}
        </div>
      </section>

      <Dialog open={Boolean(pendingArchiveVersion)} onOpenChange={(open) => !open && setPendingArchiveVersion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar archivado</DialogTitle>
            <DialogDescription>
              Esta accion archivara la version {pendingArchiveVersion?.name}. Puedes cambiar su estado si solo quieres retirarla como version publicada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingArchiveVersion(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingArchiveVersion && deleteVersion(pendingArchiveVersion)}>
              Archivar version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingJsonSave)} onOpenChange={(open) => !open && setPendingJsonSave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar cambio grande</DialogTitle>
            <DialogDescription>
              El JSON estructurado de {pendingJsonSave?.version.name} cambia de forma significativa. Revisa la vista previa antes de publicarlo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingJsonSave(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isJsonSaving}
              onClick={() => pendingJsonSave && persistStructuredJson(pendingJsonSave.version, pendingJsonSave.structuredJson)}
            >
              Guardar JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
