"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, RefreshCw, Rocket, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, mediaClient, type CertificationItem, type CertificationMutation, type MediaAsset, type PublicationCertificationReview } from "@/lib/api";

const emptyDraft = {
  title: "",
  institution: "",
  date: "",
  description: "",
  certificateUrl: "",
  attachmentId: "",
  visible: true
};

type CertificationDraft = typeof emptyDraft;

function certificationToDraft(item: CertificationItem): CertificationDraft {
  return {
    title: item.title,
    institution: item.institution,
    date: item.date,
    description: item.description || "",
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

export function CertificationManagement() {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando certificaciones.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteCertification, setPendingDeleteCertification] = useState<CertificationItem | null>(null);
  const [editingCertification, setEditingCertification] = useState<CertificationItem | null>(null);
  const [editDraft, setEditDraft] = useState<CertificationDraft>(emptyDraft);
  const [certificationReview, setCertificationReview] = useState<PublicationCertificationReview | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [draggedCertificationIndex, setDraggedCertificationIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCertifications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadCertifications() {
    setIsLoading(true);
    try {
      const [nextItems, nextMediaAssets] = await Promise.all([
        adminClient.certifications(),
        mediaClient.list()
      ]);
      setItems(nextItems);
      setMediaAssets(nextMediaAssets);
      setMessage(nextItems.length ? "Certificaciones sincronizadas con la API." : "Sin certificaciones registradas.");
    } catch {
      setMessage("No se pudieron cargar certificaciones. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  function buildMutation(source: CertificationDraft = draft, order = items.length): CertificationMutation {
    return {
      title: source.title.trim(),
      institution: source.institution.trim(),
      date: source.date.trim(),
      description: source.description.trim() || null,
      certificateUrl: source.certificateUrl.trim() || null,
      attachmentId: source.attachmentId.trim() || null,
      order,
      visible: source.visible
    };
  }

  async function createCertification() {
    const payload = buildMutation(draft, items.length);
    if (!payload.title || !payload.institution || !payload.date) {
      setMessage("Titulo, institucion y fecha son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await adminClient.createCertification(payload);
      setDraft(emptyDraft);
      setMessage("Certificacion creada.");
      await loadCertifications();
    } catch {
      setMessage("No se pudo crear la certificacion.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchCertification(id: string, data: Partial<CertificationMutation>, successMessage = "Certificacion actualizada.") {
    setBusyId(id);
    try {
      await adminClient.updateCertification(id, data);
      await loadCertifications();
      setMessage(successMessage);
    } catch {
      setMessage("No se pudo actualizar la certificacion.");
    } finally {
      setBusyId(null);
    }
  }

  function moveCertificationToIndex(fromIndex: number, toIndex: number) {
    const item = items[fromIndex];
    if (!item || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
      return;
    }
    const direction = toIndex > fromIndex ? 1 : -1;
    void patchCertification(item.id, { order: item.order + direction }, `Certificacion reordenada: ${item.title}.`);
  }

  function handleCertificationDrop(toIndex: number) {
    if (draggedCertificationIndex === null) {
      return;
    }
    moveCertificationToIndex(draggedCertificationIndex, toIndex);
    setDraggedCertificationIndex(null);
  }

  async function deleteCertification(item: CertificationItem) {
    setBusyId(item.id);
    try {
      await adminClient.deleteCertification(item.id);
      setPendingDeleteCertification(null);
      setMessage(`Certificacion eliminada: ${item.title}.`);
      await loadCertifications();
    } catch {
      setMessage("No se pudo eliminar la certificacion.");
    } finally {
      setBusyId(null);
    }
  }

  function openEditCertification(item: CertificationItem) {
    setEditingCertification(item);
    setEditDraft(certificationToDraft(item));
    setCertificationReview(null);
  }

  function closeEditCertification() {
    setEditingCertification(null);
    setCertificationReview(null);
  }

  async function updateEditingCertification() {
    if (!editingCertification) {
      return;
    }
    const payload = buildMutation(editDraft, editingCertification.order);
    if (!payload.title || !payload.institution || !payload.date) {
      setMessage("Titulo, institucion y fecha son obligatorios.");
      return;
    }

    setBusyId(editingCertification.id);
    try {
      await adminClient.updateCertification(editingCertification.id, payload);
      closeEditCertification();
      await loadCertifications();
      setMessage(`Certificacion actualizada: ${payload.title}.`);
    } catch {
      setMessage("No se pudo actualizar la certificacion.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEditingDraft() {
    if (!editingCertification) {
      return;
    }
    const payload = buildMutation(editDraft, editingCertification.order);
    if (!payload.title || !payload.institution || !payload.date) {
      setMessage("Titulo, institucion y fecha son obligatorios.");
      return;
    }

    setIsSavingDraft(true);
    try {
      await adminClient.updateCertification(editingCertification.id, { draftJson: payload });
      const review = await adminClient.publicationCertificationReview(editingCertification.id);
      setCertificationReview(review);
      setMessage(`Borrador de certificacion guardado: ${payload.title}.`);
    } catch {
      setMessage("No se pudo guardar el borrador de certificacion.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function reviewEditingDraft() {
    if (!editingCertification) {
      return;
    }

    setBusyId(editingCertification.id);
    try {
      const review = await adminClient.publicationCertificationReview(editingCertification.id);
      setCertificationReview(review);
      setMessage(review.hasDraft ? "Borrador de certificacion pendiente de publicacion." : "No hay borrador de certificacion pendiente.");
    } catch {
      setMessage("No se pudo revisar el borrador de certificacion.");
    } finally {
      setBusyId(null);
    }
  }

  async function publishEditingDraft() {
    if (!editingCertification) {
      return;
    }

    setIsPublishingDraft(true);
    try {
      const result = await adminClient.publishCertificationDraft(editingCertification.id);
      closeEditCertification();
      await loadCertifications();
      setMessage(`Borrador de certificacion publicado. Campos modificados: ${result.changedFields.join(", ")}.`);
    } catch {
      setMessage("No se pudo publicar el borrador de certificacion.");
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
            <h1 className="mt-2 text-3xl font-semibold">Certificaciones</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              CRUD basico conectado a la API para certificaciones, URLs y adjuntos.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadCertifications} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="certificationTitle">Titulo</Label>
          <Input id="certificationTitle" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="certificationInstitution">Institucion</Label>
          <Input id="certificationInstitution" value={draft.institution} onChange={(event) => setDraft((current) => ({ ...current, institution: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="certificationDate">Fecha</Label>
          <Input id="certificationDate" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="certificationUrl">URL certificado</Label>
          <Input id="certificationUrl" value={draft.certificateUrl} onChange={(event) => setDraft((current) => ({ ...current, certificateUrl: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="certificationAttachment">Adjunto ID</Label>
          <Input id="certificationAttachment" value={draft.attachmentId} onChange={(event) => setDraft((current) => ({ ...current, attachmentId: event.target.value }))} />
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="certificationAttachmentMedia">Adjunto media</Label>
          <select
            id="certificationAttachmentMedia"
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
          <Label htmlFor="certificationDescription">Descripcion</Label>
          <Textarea id="certificationDescription" rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-3">
          <Button type="button" variant={draft.visible ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, visible: !current.visible }))}>
            Visible
          </Button>
          <Button type="button" onClick={createCertification} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Crear certificacion"}
          </Button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[40px_1.2fr_1fr_100px_120px_220px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span aria-hidden="true" />
            <span>Titulo</span>
            <span>Institucion</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-[40px_1.2fr_1fr_100px_120px_220px] gap-3 border-b border-border p-3 text-sm last:border-b-0"
              data-cms-certification-id={item.id}
              draggable={busyId !== item.id}
              onDragStart={() => setDraggedCertificationIndex(index)}
              onDragEnd={() => setDraggedCertificationIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleCertificationDrop(index)}
            >
              <span className="flex items-center text-muted-foreground" aria-hidden="true">
                <GripVertical className="h-4 w-4" />
              </span>
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground">{item.institution}</span>
              <span className="text-muted-foreground">{item.date}</span>
              <span><Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "visible" : "oculta"}</Badge></span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" aria-label={`Editar ${item.title}`} onClick={() => openEditCertification(item)} disabled={busyId === item.id}>
                  <Pencil />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchCertification(item.id, { visible: !item.visible })} disabled={busyId === item.id}>
                  {item.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Subir ${item.title}`} onClick={() => patchCertification(item.id, { order: item.order - 1 }, `Certificacion reordenada: ${item.title}.`)} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Bajar ${item.title}`} onClick={() => patchCertification(item.id, { order: item.order + 1 }, `Certificacion reordenada: ${item.title}.`)} disabled={busyId === item.id}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Eliminar ${item.title}`} onClick={() => setPendingDeleteCertification(item)} disabled={busyId === item.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin certificaciones registradas.</div>
          )}
        </div>
      </section>

      <Dialog open={Boolean(editingCertification)} onOpenChange={(open) => !open && closeEditCertification()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:!max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar certificacion</DialogTitle>
            <DialogDescription>
              Actualiza titulo, institucion, fecha, certificado, adjunto, descripcion y visibilidad.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="editCertificationTitle">Titulo certificacion</Label>
              <Input id="editCertificationTitle" value={editDraft.title} onChange={(event) => setEditDraft((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editCertificationInstitution">Institucion certificacion</Label>
              <Input id="editCertificationInstitution" value={editDraft.institution} onChange={(event) => setEditDraft((current) => ({ ...current, institution: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editCertificationDate">Fecha certificacion</Label>
              <Input id="editCertificationDate" value={editDraft.date} onChange={(event) => setEditDraft((current) => ({ ...current, date: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editCertificationUrl">URL certificado certificacion</Label>
              <Input id="editCertificationUrl" value={editDraft.certificateUrl} onChange={(event) => setEditDraft((current) => ({ ...current, certificateUrl: event.target.value }))} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="editCertificationAttachment">Adjunto ID certificacion</Label>
              <Input id="editCertificationAttachment" value={editDraft.attachmentId} onChange={(event) => setEditDraft((current) => ({ ...current, attachmentId: event.target.value }))} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="editCertificationAttachmentMedia">Adjunto media certificacion</Label>
              <select
                id="editCertificationAttachmentMedia"
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
              <Label htmlFor="editCertificationDescription">Descripcion certificacion</Label>
              <Textarea id="editCertificationDescription" rows={4} value={editDraft.description} onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Button type="button" variant={editDraft.visible ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, visible: !current.visible }))}>
                {editDraft.visible ? "Visible" : "Oculta"}
              </Button>
            </div>
          </div>
          {certificationReview ? (
            <section className="grid gap-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Revision borrador certificacion</h3>
                  <p className="text-sm text-muted-foreground">
                    {certificationReview.hasDraft ? "Cambios pendientes antes de publicar." : "Sin cambios pendientes."}
                  </p>
                </div>
                <Badge variant={certificationReview.hasDraft ? "default" : "outline"}>
                  {certificationReview.fields.filter((field) => field.changed).length} cambios
                </Badge>
              </div>
              <div className="grid gap-2">
                {certificationReview.fields.filter((field) => field.changed).slice(0, 6).map((field) => (
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
            <Button type="button" variant="outline" onClick={closeEditCertification}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={saveEditingDraft} disabled={isSavingDraft}>
              <Save data-icon="inline-start" />
              {isSavingDraft ? "Guardando borrador..." : "Guardar borrador"}
            </Button>
            <Button type="button" variant="outline" onClick={reviewEditingDraft} disabled={Boolean(editingCertification && busyId === editingCertification.id)}>
              Revisar borrador
            </Button>
            <Button type="button" onClick={publishEditingDraft} disabled={!certificationReview?.hasDraft || isPublishingDraft}>
              <Rocket data-icon="inline-start" />
              {isPublishingDraft ? "Publicando..." : "Publicar borrador"}
            </Button>
            <Button type="button" onClick={updateEditingCertification} disabled={Boolean(editingCertification && busyId === editingCertification.id)}>
              Guardar certificacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteCertification)} onOpenChange={(open) => !open && setPendingDeleteCertification(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar borrado</DialogTitle>
            <DialogDescription>
              Esta accion eliminara la certificacion {pendingDeleteCertification?.title}. Puedes ocultarla si solo quieres retirarla de la landing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteCertification(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteCertification && deleteCertification(pendingDeleteCertification)}>
              Eliminar certificacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
