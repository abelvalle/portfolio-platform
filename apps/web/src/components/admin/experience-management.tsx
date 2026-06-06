"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, RefreshCw, Save, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, type ExperienceItem, type ExperienceMutation } from "@/lib/api";

type DraftExperience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  modality: string;
  description: string;
  achievements: string;
  responsibilities: string;
  technologies: string;
  methodologies: string;
  skills: string;
  visible: boolean;
  featured: boolean;
};

const emptyDraft: DraftExperience = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  current: false,
  location: "",
  modality: "not_specified",
  description: "",
  achievements: "",
  responsibilities: "",
  technologies: "",
  methodologies: "",
  skills: "",
  visible: true,
  featured: false
};

function splitList(value: string) {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function toInputDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function experienceToDraft(item: ExperienceItem): DraftExperience {
  return {
    company: item.company,
    role: item.role,
    startDate: toInputDate(item.startDate),
    endDate: toInputDate(item.endDate),
    current: item.current,
    location: item.location || "",
    modality: item.modality || "not_specified",
    description: item.description,
    achievements: item.achievements.join("\n"),
    responsibilities: item.responsibilities.join("\n"),
    technologies: item.technologies.join("\n"),
    methodologies: item.methodologies.join("\n"),
    skills: item.skills.join("\n"),
    visible: item.visible,
    featured: item.featured
  };
}

function buildMutation(draft: DraftExperience, order: number): ExperienceMutation {
  return {
    company: draft.company.trim(),
    role: draft.role.trim(),
    startDate: draft.startDate,
    endDate: draft.current || !draft.endDate ? null : draft.endDate,
    current: draft.current,
    location: draft.location.trim() || null,
    modality: draft.modality.trim() || "not_specified",
    description: draft.description.trim(),
    achievements: splitList(draft.achievements),
    responsibilities: splitList(draft.responsibilities),
    technologies: splitList(draft.technologies),
    methodologies: splitList(draft.methodologies),
    skills: splitList(draft.skills),
    order,
    visible: draft.visible,
    featured: draft.featured
  };
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Actualidad";
}

export function ExperienceManagement() {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [draft, setDraft] = useState<DraftExperience>(emptyDraft);
  const [message, setMessage] = useState("Cargando experiencias.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteExperience, setPendingDeleteExperience] = useState<ExperienceItem | null>(null);
  const [editingExperience, setEditingExperience] = useState<ExperienceItem | null>(null);
  const [editDraft, setEditDraft] = useState<DraftExperience>(emptyDraft);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadExperiences();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadExperiences() {
    setIsLoading(true);
    try {
      const nextItems = await adminClient.experiences();
      setItems(nextItems);
      setMessage(nextItems.length ? "Experiencias sincronizadas con la API." : "Sin experiencias registradas.");
    } catch {
      setMessage("No se pudieron cargar experiencias. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createExperience() {
    const payload = buildMutation(draft, items.length);
    if (!payload.company || !payload.role || !payload.startDate || !payload.description) {
      setMessage("Empresa, cargo, fecha inicio y descripcion son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await adminClient.createExperience(payload);
      setDraft(emptyDraft);
      setMessage("Experiencia creada.");
      await loadExperiences();
    } catch {
      setMessage("No se pudo crear la experiencia.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchExperience(id: string, data: Partial<ExperienceMutation>) {
    setBusyId(id);
    try {
      await adminClient.updateExperience(id, data);
      setMessage("Experiencia actualizada.");
      await loadExperiences();
    } catch {
      setMessage("No se pudo actualizar la experiencia.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteExperience(item: ExperienceItem) {
    setBusyId(item.id);
    try {
      await adminClient.deleteExperience(item.id);
      setPendingDeleteExperience(null);
      setMessage(`Experiencia eliminada: ${item.company}.`);
      await loadExperiences();
    } catch {
      setMessage("No se pudo eliminar la experiencia.");
    } finally {
      setBusyId(null);
    }
  }

  function openEditExperience(item: ExperienceItem) {
    setEditingExperience(item);
    setEditDraft(experienceToDraft(item));
  }

  async function updateEditingExperience() {
    if (!editingExperience) {
      return;
    }
    const payload = buildMutation(editDraft, editingExperience.order);
    if (!payload.company || !payload.role || !payload.startDate || !payload.description) {
      setMessage("Empresa, cargo, fecha inicio y descripcion son obligatorios.");
      return;
    }

    setBusyId(editingExperience.id);
    try {
      await adminClient.updateExperience(editingExperience.id, payload);
      setEditingExperience(null);
      await loadExperiences();
      setMessage(`Experiencia actualizada: ${payload.company}.`);
    } catch {
      setMessage("No se pudo actualizar la experiencia.");
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
            <h1 className="mt-2 text-3xl font-semibold">Experiencia profesional</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              CRUD basico conectado a la API para gestionar experiencias visibles en el portfolio.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadExperiences} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="company">Empresa</Label>
          <Input id="company" value={draft.company} onChange={(event) => setDraft((current) => ({ ...current, company: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Cargo</Label>
          <Input id="role" value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startDate">Fecha inicio</Label>
          <Input id="startDate" type="date" value={draft.startDate} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">Fecha fin</Label>
          <Input id="endDate" type="date" value={draft.endDate} disabled={draft.current} onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="location">Ubicacion</Label>
          <Input id="location" value={draft.location} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="modality">Modalidad</Label>
          <Input id="modality" value={draft.modality} onChange={(event) => setDraft((current) => ({ ...current, modality: event.target.value }))} />
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="description">Descripcion</Label>
          <Textarea id="description" rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        {(["achievements", "responsibilities", "technologies", "methodologies", "skills"] as const).map((field) => (
          <div className="grid gap-2" key={field}>
            <Label htmlFor={field}>{field}</Label>
            <Textarea id={field} rows={3} value={draft[field]} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} />
          </div>
        ))}
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          <Button type="button" variant={draft.current ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, current: !current.current }))}>
            Actual
          </Button>
          <Button type="button" variant={draft.visible ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, visible: !current.visible }))}>
            Visible
          </Button>
          <Button type="button" variant={draft.featured ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, featured: !current.featured }))}>
            Destacada
          </Button>
          <Button type="button" onClick={createExperience} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Crear experiencia"}
          </Button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[1.3fr_1.3fr_140px_130px_220px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Empresa</span>
            <span>Cargo</span>
            <span>Fechas</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.3fr_1.3fr_140px_130px_220px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-medium">{item.company}</span>
              <span className="text-muted-foreground">{item.role}</span>
              <span className="text-muted-foreground">{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
              <span className="flex flex-wrap gap-1">
                <Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "visible" : "oculta"}</Badge>
                {item.featured ? <Badge variant="outline">destacada</Badge> : null}
              </span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" aria-label={`Editar ${item.company}`} onClick={() => openEditExperience(item)} disabled={busyId === item.id}>
                  <Pencil />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchExperience(item.id, { visible: !item.visible })} disabled={busyId === item.id}>
                  {item.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchExperience(item.id, { featured: !item.featured })} disabled={busyId === item.id}>
                  <Star />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Eliminar ${item.company}`} onClick={() => setPendingDeleteExperience(item)} disabled={busyId === item.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin experiencias registradas.</div>
          )}
        </div>
      </section>

      <Dialog open={Boolean(editingExperience)} onOpenChange={(open) => !open && setEditingExperience(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar experiencia</DialogTitle>
            <DialogDescription>
              Actualiza empresa, cargo, fechas, modalidad, descripcion, listas asociadas y visibilidad.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="editExperienceCompany">Empresa experiencia</Label>
              <Input id="editExperienceCompany" value={editDraft.company} onChange={(event) => setEditDraft((current) => ({ ...current, company: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editExperienceRole">Cargo experiencia</Label>
              <Input id="editExperienceRole" value={editDraft.role} onChange={(event) => setEditDraft((current) => ({ ...current, role: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editExperienceStartDate">Fecha inicio experiencia</Label>
              <Input id="editExperienceStartDate" type="date" value={editDraft.startDate} onChange={(event) => setEditDraft((current) => ({ ...current, startDate: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editExperienceEndDate">Fecha fin experiencia</Label>
              <Input id="editExperienceEndDate" type="date" value={editDraft.endDate} disabled={editDraft.current} onChange={(event) => setEditDraft((current) => ({ ...current, endDate: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editExperienceLocation">Ubicacion experiencia</Label>
              <Input id="editExperienceLocation" value={editDraft.location} onChange={(event) => setEditDraft((current) => ({ ...current, location: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editExperienceModality">Modalidad experiencia</Label>
              <Input id="editExperienceModality" value={editDraft.modality} onChange={(event) => setEditDraft((current) => ({ ...current, modality: event.target.value }))} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="editExperienceDescription">Descripcion experiencia</Label>
              <Textarea id="editExperienceDescription" rows={4} value={editDraft.description} onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))} />
            </div>
            {(["achievements", "responsibilities", "technologies", "methodologies", "skills"] as const).map((field) => (
              <div className="grid gap-2" key={field}>
                <Label htmlFor={`editExperience${field}`}>{field} experiencia</Label>
                <Textarea id={`editExperience${field}`} rows={3} value={editDraft[field]} onChange={(event) => setEditDraft((current) => ({ ...current, [field]: event.target.value }))} />
              </div>
            ))}
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="button" variant={editDraft.current ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, current: !current.current }))}>
                Actual
              </Button>
              <Button type="button" variant={editDraft.visible ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, visible: !current.visible }))}>
                Visible
              </Button>
              <Button type="button" variant={editDraft.featured ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, featured: !current.featured }))}>
                Destacada
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingExperience(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={updateEditingExperience} disabled={Boolean(editingExperience && busyId === editingExperience.id)}>
              Guardar experiencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteExperience)} onOpenChange={(open) => !open && setPendingDeleteExperience(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar borrado</DialogTitle>
            <DialogDescription>
              Esta accion eliminara la experiencia de {pendingDeleteExperience?.company}. Puedes ocultarla si solo quieres retirarla de la landing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteExperience(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteExperience && deleteExperience(pendingDeleteExperience)}>
              Eliminar experiencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
