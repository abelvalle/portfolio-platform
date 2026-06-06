"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, type EducationItem, type EducationMutation } from "@/lib/api";

const emptyDraft = {
  title: "",
  institution: "",
  date: "",
  description: "",
  type: "study",
  certificateUrl: "",
  attachmentId: "",
  visible: true
};

export function EducationManagement() {
  const [items, setItems] = useState<EducationItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando estudios.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEducation();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadEducation() {
    setIsLoading(true);
    try {
      const nextItems = await adminClient.education();
      setItems(nextItems);
      setMessage(nextItems.length ? "Estudios sincronizados con la API." : "Sin estudios registrados.");
    } catch {
      setMessage("No se pudieron cargar estudios. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  function buildMutation(order = items.length): EducationMutation {
    return {
      title: draft.title.trim(),
      institution: draft.institution.trim(),
      date: draft.date.trim(),
      description: draft.description.trim() || null,
      type: draft.type.trim() || "study",
      certificateUrl: draft.certificateUrl.trim() || null,
      attachmentId: draft.attachmentId.trim() || null,
      order,
      visible: draft.visible
    };
  }

  async function createEducation() {
    const payload = buildMutation(items.length);
    if (!payload.title || !payload.institution || !payload.date) {
      setMessage("Titulo, institucion y fecha son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await adminClient.createEducation(payload);
      setDraft(emptyDraft);
      setMessage("Estudio creado.");
      await loadEducation();
    } catch {
      setMessage("No se pudo crear el estudio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchEducation(id: string, data: Partial<EducationMutation>) {
    setBusyId(id);
    try {
      await adminClient.updateEducation(id, data);
      setMessage("Estudio actualizado.");
      await loadEducation();
    } catch {
      setMessage("No se pudo actualizar el estudio.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteEducation(id: string) {
    setBusyId(id);
    try {
      await adminClient.deleteEducation(id);
      setMessage("Estudio eliminado.");
      await loadEducation();
    } catch {
      setMessage("No se pudo eliminar el estudio.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">Portfolio CMS</p>
            <h1 className="mt-2 text-3xl font-semibold">Estudios</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              CRUD basico conectado a la API para estudios, cursos y certificados dentro de Education.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadEducation} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="educationTitle">Titulo</Label>
          <Input id="educationTitle" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="educationInstitution">Institucion</Label>
          <Input id="educationInstitution" value={draft.institution} onChange={(event) => setDraft((current) => ({ ...current, institution: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="educationDate">Fecha</Label>
          <Input id="educationDate" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="educationType">Tipo</Label>
          <Input id="educationType" value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="educationCertificateUrl">URL certificado</Label>
          <Input id="educationCertificateUrl" value={draft.certificateUrl} onChange={(event) => setDraft((current) => ({ ...current, certificateUrl: event.target.value }))} />
        </div>
        <div className="grid gap-2 md:col-span-3">
          <Label htmlFor="educationDescription">Descripcion</Label>
          <Textarea id="educationDescription" rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <Button type="button" variant={draft.visible ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, visible: !current.visible }))}>
            Visible
          </Button>
          <Button type="button" onClick={createEducation} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Crear estudio"}
          </Button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1.2fr_1fr_100px_120px_180px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Titulo</span>
            <span>Institucion</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.2fr_1fr_100px_120px_180px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground">{item.institution}</span>
              <span className="text-muted-foreground">{item.date}</span>
              <span><Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "visible" : "oculto"}</Badge></span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => patchEducation(item.id, { visible: !item.visible })} disabled={busyId === item.id}>
                  {item.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchEducation(item.id, { order: item.order - 1 })} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchEducation(item.id, { order: item.order + 1 })} disabled={busyId === item.id}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => deleteEducation(item.id)} disabled={busyId === item.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin estudios registrados.</div>
          )}
        </div>
      </section>
    </div>
  );
}
