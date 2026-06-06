"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

type EducationDraft = typeof emptyDraft;

function educationToDraft(item: EducationItem): EducationDraft {
  return {
    title: item.title,
    institution: item.institution,
    date: item.date,
    description: item.description || "",
    type: item.type || "study",
    certificateUrl: item.certificateUrl || "",
    attachmentId: item.attachmentId || "",
    visible: item.visible
  };
}

export function EducationManagement() {
  const [items, setItems] = useState<EducationItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando estudios.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteEducation, setPendingDeleteEducation] = useState<EducationItem | null>(null);
  const [editingEducation, setEditingEducation] = useState<EducationItem | null>(null);
  const [editDraft, setEditDraft] = useState<EducationDraft>(emptyDraft);

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

  function buildMutation(source: EducationDraft = draft, order = items.length): EducationMutation {
    return {
      title: source.title.trim(),
      institution: source.institution.trim(),
      date: source.date.trim(),
      description: source.description.trim() || null,
      type: source.type.trim() || "study",
      certificateUrl: source.certificateUrl.trim() || null,
      attachmentId: source.attachmentId.trim() || null,
      order,
      visible: source.visible
    };
  }

  async function createEducation() {
    const payload = buildMutation(draft, items.length);
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

  async function deleteEducation(item: EducationItem) {
    setBusyId(item.id);
    try {
      await adminClient.deleteEducation(item.id);
      setPendingDeleteEducation(null);
      setMessage(`Estudio eliminado: ${item.title}.`);
      await loadEducation();
    } catch {
      setMessage("No se pudo eliminar el estudio.");
    } finally {
      setBusyId(null);
    }
  }

  function openEditEducation(item: EducationItem) {
    setEditingEducation(item);
    setEditDraft(educationToDraft(item));
  }

  async function updateEditingEducation() {
    if (!editingEducation) {
      return;
    }
    const payload = buildMutation(editDraft, editingEducation.order);
    if (!payload.title || !payload.institution || !payload.date) {
      setMessage("Titulo, institucion y fecha son obligatorios.");
      return;
    }

    setBusyId(editingEducation.id);
    try {
      await adminClient.updateEducation(editingEducation.id, payload);
      setEditingEducation(null);
      await loadEducation();
      setMessage(`Estudio actualizado: ${payload.title}.`);
    } catch {
      setMessage("No se pudo actualizar el estudio.");
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
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[1.2fr_1fr_100px_120px_220px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Titulo</span>
            <span>Institucion</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.2fr_1fr_100px_120px_220px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground">{item.institution}</span>
              <span className="text-muted-foreground">{item.date}</span>
              <span><Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "visible" : "oculto"}</Badge></span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" aria-label={`Editar ${item.title}`} onClick={() => openEditEducation(item)} disabled={busyId === item.id}>
                  <Pencil />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchEducation(item.id, { visible: !item.visible })} disabled={busyId === item.id}>
                  {item.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchEducation(item.id, { order: item.order - 1 })} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchEducation(item.id, { order: item.order + 1 })} disabled={busyId === item.id}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Eliminar ${item.title}`} onClick={() => setPendingDeleteEducation(item)} disabled={busyId === item.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin estudios registrados.</div>
          )}
        </div>
      </section>

      <Dialog open={Boolean(editingEducation)} onOpenChange={(open) => !open && setEditingEducation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar estudio</DialogTitle>
            <DialogDescription>
              Actualiza titulo, institucion, fecha, tipo, adjuntos, descripcion y visibilidad del estudio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="editEducationTitle">Titulo estudio</Label>
              <Input id="editEducationTitle" value={editDraft.title} onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editEducationInstitution">Institucion estudio</Label>
              <Input id="editEducationInstitution" value={editDraft.institution} onChange={(event) => setEditDraft((current) => ({ ...current, institution: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editEducationDate">Fecha estudio</Label>
              <Input id="editEducationDate" value={editDraft.date} onChange={(event) => setEditDraft((current) => ({ ...current, date: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editEducationType">Tipo estudio</Label>
              <Input id="editEducationType" value={editDraft.type} onChange={(event) => setEditDraft((current) => ({ ...current, type: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editEducationCertificateUrl">URL certificado estudio</Label>
              <Input id="editEducationCertificateUrl" value={editDraft.certificateUrl} onChange={(event) => setEditDraft((current) => ({ ...current, certificateUrl: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editEducationAttachment">Adjunto ID estudio</Label>
              <Input id="editEducationAttachment" value={editDraft.attachmentId} onChange={(event) => setEditDraft((current) => ({ ...current, attachmentId: event.target.value }))} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="editEducationDescription">Descripcion estudio</Label>
              <Textarea id="editEducationDescription" rows={4} value={editDraft.description} onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button type="button" variant={editDraft.visible ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, visible: !current.visible }))}>
                {editDraft.visible ? "Visible" : "Oculto"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingEducation(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={updateEditingEducation} disabled={Boolean(editingEducation && busyId === editingEducation.id)}>
              Guardar estudio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteEducation)} onOpenChange={(open) => !open && setPendingDeleteEducation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar borrado</DialogTitle>
            <DialogDescription>
              Esta accion eliminara el estudio {pendingDeleteEducation?.title}. Puedes ocultarlo si solo quieres retirarlo de la landing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteEducation(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteEducation && deleteEducation(pendingDeleteEducation)}>
              Eliminar estudio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
