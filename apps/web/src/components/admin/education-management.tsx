"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, RefreshCw, Rocket, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, mediaClient, type EducationItem, type EducationMutation, type MediaAsset, type PublicationEducationReview } from "@/lib/api";

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

function mediaAssetLabel(asset: MediaAsset) {
  return asset.originalName || asset.filename;
}

function formatPublicationValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ") || "-";
  }
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "boolean") {
    return value ? "si" : "no";
  }
  return String(value);
}

export function EducationManagement() {
  const [items, setItems] = useState<EducationItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando estudios.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteEducation, setPendingDeleteEducation] = useState<EducationItem | null>(null);
  const [editingEducation, setEditingEducation] = useState<EducationItem | null>(null);
  const [editDraft, setEditDraft] = useState<EducationDraft>(emptyDraft);
  const [educationReview, setEducationReview] = useState<PublicationEducationReview | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEducation();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadEducation() {
    setIsLoading(true);
    try {
      const [nextItems, nextMediaAssets] = await Promise.all([
        adminClient.education(),
        mediaClient.list()
      ]);
      setItems(nextItems);
      setMediaAssets(nextMediaAssets);
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

  async function patchEducation(id: string, data: Partial<EducationMutation>, successMessage = "Estudio actualizado.") {
    setBusyId(id);
    try {
      await adminClient.updateEducation(id, data);
      await loadEducation();
      setMessage(successMessage);
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
    setEducationReview(null);
  }

  function closeEditEducation() {
    setEditingEducation(null);
    setEducationReview(null);
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
      closeEditEducation();
      await loadEducation();
      setMessage(`Estudio actualizado: ${payload.title}.`);
    } catch {
      setMessage("No se pudo actualizar el estudio.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEditingDraft() {
    if (!editingEducation) {
      return;
    }
    const payload = buildMutation(editDraft, editingEducation.order);
    if (!payload.title || !payload.institution || !payload.date) {
      setMessage("Titulo, institucion y fecha son obligatorios.");
      return;
    }

    setIsSavingDraft(true);
    try {
      await adminClient.updateEducation(editingEducation.id, { draftJson: payload });
      const review = await adminClient.publicationEducationReview(editingEducation.id);
      setEducationReview(review);
      setMessage(`Borrador de estudio guardado: ${payload.title}.`);
    } catch {
      setMessage("No se pudo guardar el borrador de estudio.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function reviewEditingDraft() {
    if (!editingEducation) {
      return;
    }

    setBusyId(editingEducation.id);
    try {
      const review = await adminClient.publicationEducationReview(editingEducation.id);
      setEducationReview(review);
      setMessage(review.hasDraft ? "Borrador de estudio pendiente de publicacion." : "No hay borrador de estudio pendiente.");
    } catch {
      setMessage("No se pudo revisar el borrador de estudio.");
    } finally {
      setBusyId(null);
    }
  }

  async function publishEditingDraft() {
    if (!editingEducation) {
      return;
    }

    setIsPublishingDraft(true);
    try {
      const result = await adminClient.publishEducationDraft(editingEducation.id);
      closeEditEducation();
      await loadEducation();
      setMessage(`Borrador de estudio publicado. Campos modificados: ${result.changedFields.join(", ")}.`);
    } catch {
      setMessage("No se pudo publicar el borrador de estudio.");
    } finally {
      setIsPublishingDraft(false);
    }
  }

  const selectedDraftAttachment = mediaAssets.some((asset) => asset.id === draft.attachmentId) ? draft.attachmentId : "";
  const selectedEditAttachment = mediaAssets.some((asset) => asset.id === editDraft.attachmentId) ? editDraft.attachmentId : "";

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
        <div className="grid gap-2">
          <Label htmlFor="educationAttachment">Adjunto ID</Label>
          <Input id="educationAttachment" value={draft.attachmentId} onChange={(event) => setDraft((current) => ({ ...current, attachmentId: event.target.value }))} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="educationAttachmentMedia">Adjunto media</Label>
          <select
            id="educationAttachmentMedia"
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={selectedDraftAttachment}
            onChange={(event) => setDraft((current) => ({ ...current, attachmentId: event.target.value }))}
          >
            <option value="">{mediaAssets.length ? "Seleccionar asset" : "Sin assets en media"}</option>
            {mediaAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>{mediaAssetLabel(asset)}</option>
            ))}
          </select>
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
                <Button type="button" variant="outline" size="icon" aria-label={`Subir ${item.title}`} onClick={() => patchEducation(item.id, { order: item.order - 1 }, `Estudio reordenado: ${item.title}.`)} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Bajar ${item.title}`} onClick={() => patchEducation(item.id, { order: item.order + 1 }, `Estudio reordenado: ${item.title}.`)} disabled={busyId === item.id}>
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

      <Dialog open={Boolean(editingEducation)} onOpenChange={(open) => !open && closeEditEducation()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:!max-w-4xl">
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
              <Label htmlFor="editEducationAttachmentMedia">Adjunto media estudio</Label>
              <select
                id="editEducationAttachmentMedia"
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                value={selectedEditAttachment}
                onChange={(event) => setEditDraft((current) => ({ ...current, attachmentId: event.target.value }))}
              >
                <option value="">{mediaAssets.length ? "Seleccionar asset" : "Sin assets en media"}</option>
                {mediaAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{mediaAssetLabel(asset)}</option>
                ))}
              </select>
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
          {educationReview ? (
            <section className="grid gap-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Revision borrador estudio</h3>
                  <p className="text-sm text-muted-foreground">
                    {educationReview.hasDraft ? "Cambios pendientes antes de publicar." : "Sin cambios pendientes."}
                  </p>
                </div>
                <Badge variant={educationReview.hasDraft ? "default" : "outline"}>
                  {educationReview.fields.filter((field) => field.changed).length} cambios
                </Badge>
              </div>
              <div className="grid gap-2">
                {educationReview.fields.filter((field) => field.changed).slice(0, 6).map((field) => (
                  <div key={field.field} className="grid gap-1 rounded-md bg-muted/40 p-2 text-sm md:grid-cols-[140px_1fr_1fr]">
                    <span className="font-medium">{field.field}</span>
                    <span className="truncate text-muted-foreground">{formatPublicationValue(field.before)}</span>
                    <span className="truncate">{formatPublicationValue(field.after)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <DialogFooter className="flex-wrap">
            <Button type="button" variant="outline" onClick={closeEditEducation}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={saveEditingDraft} disabled={isSavingDraft}>
              <Save data-icon="inline-start" />
              {isSavingDraft ? "Guardando borrador..." : "Guardar borrador"}
            </Button>
            <Button type="button" variant="outline" onClick={reviewEditingDraft} disabled={Boolean(editingEducation && busyId === editingEducation.id)}>
              Revisar borrador
            </Button>
            <Button type="button" onClick={publishEditingDraft} disabled={!educationReview?.hasDraft || isPublishingDraft}>
              <Rocket data-icon="inline-start" />
              {isPublishingDraft ? "Publicando..." : "Publicar borrador"}
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
