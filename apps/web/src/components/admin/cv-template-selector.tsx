"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, type CvTemplateItem, type CvTemplateMutation } from "@/lib/api";

const emptyDraft = {
  name: "",
  description: "",
  primaryColor: "#111827",
  fontFamily: "Inter",
  density: "normal",
  showPhoto: true,
  showIcons: true,
  visible: true
};

const templateDensities = ["normal", "compact"] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildConfig(draft: typeof emptyDraft) {
  return {
    primaryColor: draft.primaryColor.trim() || "#111827",
    fontFamily: draft.fontFamily.trim() || "Inter",
    density: templateDensities.includes(draft.density.trim() as (typeof templateDensities)[number]) ? draft.density.trim() : "normal",
    showPhoto: draft.showPhoto,
    showIcons: draft.showIcons
  };
}

function validateTemplateDraft(draft: typeof emptyDraft) {
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(draft.primaryColor.trim())) {
    return "Color principal debe ser HEX (#RRGGBB).";
  }
  if (!templateDensities.includes(draft.density.trim() as (typeof templateDensities)[number])) {
    return "Densidad debe ser normal o compact.";
  }
  return "";
}

function getTemplatePreviewConfig(template: CvTemplateItem) {
  const config = template.config || {};
  const primaryColor = typeof config.primaryColor === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(config.primaryColor)
    ? config.primaryColor
    : "#111827";
  const fontFamily = typeof config.fontFamily === "string" && config.fontFamily.trim() ? config.fontFamily : "Inter";
  const density = config.density === "compact" ? "compact" : "normal";

  return { primaryColor, fontFamily, density };
}

function TemplatePreview({ template }: { template: CvTemplateItem }) {
  const config = getTemplatePreviewConfig(template);
  const lineGap = config.density === "compact" ? "gap-1" : "gap-1.5";

  return (
    <div
      aria-label={`Preview de ${template.name}`}
      className="mt-4 rounded-md border bg-background p-3"
      style={{ borderColor: config.primaryColor, fontFamily: config.fontFamily }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-normal" style={{ color: config.primaryColor }}>Abel Valle Rosa</p>
          <p className="mt-1 text-[0.6rem] text-muted-foreground">Titular profesional</p>
        </div>
        <span className="h-7 w-7 rounded-full" style={{ backgroundColor: config.primaryColor }} />
      </div>
      <div className={`mt-3 grid ${lineGap}`}>
        <span className="h-1.5 w-3/4 rounded-full bg-muted" />
        <span className="h-1.5 w-full rounded-full bg-muted" />
        <span className="h-1.5 w-2/3 rounded-full bg-muted" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="h-6 rounded-sm bg-muted" />
        <span className="h-6 rounded-sm bg-muted" />
      </div>
    </div>
  );
}

export function CvTemplateSelector() {
  const [templates, setTemplates] = useState<CvTemplateItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando plantillas.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<CvTemplateItem | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTemplates();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadTemplates() {
    setIsLoading(true);
    try {
      const nextTemplates = await cvClient.templates();
      setTemplates(nextTemplates);
      setMessage(nextTemplates.length ? "Plantillas sincronizadas con la API." : "Sin plantillas registradas.");
    } catch {
      setMessage("No se pudieron cargar plantillas. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  function buildMutation(order = templates.length): CvTemplateMutation {
    return {
      name: draft.name.trim(),
      slug: slugify(draft.name.trim()),
      description: draft.description.trim() || null,
      config: buildConfig(draft),
      visible: draft.visible,
      order
    };
  }

  async function createTemplate() {
    const validationMessage = validateTemplateDraft(draft);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    const payload = buildMutation(templates.length);
    if (!payload.name || !payload.slug) {
      setMessage("Nombre de plantilla obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      await cvClient.createTemplate(payload);
      setDraft(emptyDraft);
      setMessage("Plantilla creada.");
      await loadTemplates();
    } catch {
      setMessage("No se pudo crear la plantilla.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchTemplate(id: string, data: Partial<CvTemplateMutation>) {
    setBusyId(id);
    try {
      await cvClient.updateTemplate(id, data);
      setMessage("Plantilla actualizada.");
      await loadTemplates();
    } catch {
      setMessage("No se pudo actualizar la plantilla.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTemplate(template: CvTemplateItem) {
    setBusyId(template.id);
    try {
      await cvClient.deleteTemplate(template.id);
      setPendingDeleteTemplate(null);
      setMessage(`Plantilla eliminada: ${template.name}.`);
      await loadTemplates();
    } catch {
      setMessage("No se pudo eliminar la plantilla.");
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
            <h1 className="mt-2 text-3xl font-semibold">Plantillas de CV</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Plantillas reales desde la API para previews publicas y exportaciones.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadTemplates} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="templateName">Nombre</Label>
          <Input id="templateName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="primaryColor">Color principal</Label>
          <Input id="primaryColor" value={draft.primaryColor} onChange={(event) => setDraft((current) => ({ ...current, primaryColor: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fontFamily">Tipografia</Label>
          <Input id="fontFamily" value={draft.fontFamily} onChange={(event) => setDraft((current) => ({ ...current, fontFamily: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="density">Densidad</Label>
          <select
            id="density"
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={draft.density}
            onChange={(event) => setDraft((current) => ({ ...current, density: event.target.value }))}
          >
            {templateDensities.map((density) => (
              <option key={density} value={density}>{density}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="templateDescription">Descripcion</Label>
          <Textarea id="templateDescription" rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <Button type="button" variant={draft.visible ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, visible: !current.visible }))}>
            Visible
          </Button>
          <Button type="button" variant={draft.showPhoto ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, showPhoto: !current.showPhoto }))}>
            Foto
          </Button>
          <Button type="button" variant={draft.showIcons ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, showIcons: !current.showIcons }))}>
            Iconos
          </Button>
          <Button type="button" onClick={createTemplate} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Crear plantilla"}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.length ? templates.map((template) => (
          <div key={template.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{template.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{template.slug}</p>
              </div>
              <Badge variant={template.visible ? "default" : "secondary"}>{template.visible ? "visible" : "oculta"}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{template.description || "Sin descripcion."}</p>
            <TemplatePreview template={template} />
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(template.config || {}).slice(0, 5).map(([key, value]) => (
                <Badge key={key} variant="outline">{key}: {String(value)}</Badge>
              ))}
            </div>
            <div className="mt-5 flex gap-1">
              <Button type="button" variant="outline" size="icon" onClick={() => patchTemplate(template.id, { visible: !template.visible })} disabled={busyId === template.id}>
                {template.visible ? <EyeOff /> : <Eye />}
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => patchTemplate(template.id, { order: template.order - 1 })} disabled={busyId === template.id}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => patchTemplate(template.id, { order: template.order + 1 })} disabled={busyId === template.id}>
                <ArrowDown />
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label={`Eliminar ${template.name}`} onClick={() => setPendingDeleteTemplate(template)} disabled={busyId === template.id}>
                <Trash2 />
              </Button>
            </div>
          </div>
        )) : (
          <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            Sin plantillas registradas.
          </div>
        )}
      </section>

      <Dialog open={Boolean(pendingDeleteTemplate)} onOpenChange={(open) => !open && setPendingDeleteTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar borrado</DialogTitle>
            <DialogDescription>
              Esta accion eliminara la plantilla {pendingDeleteTemplate?.name}. Puedes ocultarla si solo quieres retirarla de previews publicas y exportaciones.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteTemplate(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteTemplate && deleteTemplate(pendingDeleteTemplate)}>
              Eliminar plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
