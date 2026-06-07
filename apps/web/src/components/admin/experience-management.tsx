"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, RefreshCw, Rocket, Save, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, type ExperienceItem, type ExperienceMutation, type PublicationExperienceReview, type SkillItem } from "@/lib/api";

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

function joinList(values: string[]) {
  return values.join("\n");
}

function toggleListValue(value: string, option: string) {
  const items = splitList(value);
  const exists = items.some((item) => item.toLowerCase() === option.toLowerCase());
  return joinList(exists ? items.filter((item) => item.toLowerCase() !== option.toLowerCase()) : [...items, option]);
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

function uniqueList(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function skillNames(skills: SkillItem[]) {
  return uniqueList(skills.map((skill) => skill.name));
}

export function ExperienceManagement() {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [draft, setDraft] = useState<DraftExperience>(emptyDraft);
  const [message, setMessage] = useState("Cargando experiencias.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteExperience, setPendingDeleteExperience] = useState<ExperienceItem | null>(null);
  const [editingExperience, setEditingExperience] = useState<ExperienceItem | null>(null);
  const [editDraft, setEditDraft] = useState<DraftExperience>(emptyDraft);
  const [experienceReview, setExperienceReview] = useState<PublicationExperienceReview | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [draggedExperienceIndex, setDraggedExperienceIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadExperiences();
      void loadSkillOptions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const technologyOptions = uniqueList(items.flatMap((item) => item.technologies)).slice(0, 12);

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

  async function loadSkillOptions() {
    try {
      const nextSkills = await adminClient.skills();
      setSkillOptions(skillNames(nextSkills).slice(0, 16));
    } catch {
      setSkillOptions([]);
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

  async function patchExperience(id: string, data: Partial<ExperienceMutation>, successMessage = "Experiencia actualizada.") {
    setBusyId(id);
    try {
      await adminClient.updateExperience(id, data);
      await loadExperiences();
      setMessage(successMessage);
    } catch {
      setMessage("No se pudo actualizar la experiencia.");
    } finally {
      setBusyId(null);
    }
  }

  function moveExperienceToIndex(fromIndex: number, toIndex: number) {
    const item = items[fromIndex];
    if (!item || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
      return;
    }
    const direction = toIndex > fromIndex ? 1 : -1;
    void patchExperience(item.id, { order: item.order + direction }, `Experiencia reordenada: ${item.company}.`);
  }

  function handleExperienceDrop(toIndex: number) {
    if (draggedExperienceIndex === null) {
      return;
    }
    moveExperienceToIndex(draggedExperienceIndex, toIndex);
    setDraggedExperienceIndex(null);
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
    setExperienceReview(null);
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

  async function saveEditingDraft() {
    if (!editingExperience) {
      return;
    }
    const payload = buildMutation(editDraft, editingExperience.order);
    if (!payload.company || !payload.role || !payload.startDate || !payload.description) {
      setMessage("Empresa, cargo, fecha inicio y descripcion son obligatorios.");
      return;
    }

    setIsSavingDraft(true);
    try {
      await adminClient.updateExperience(editingExperience.id, { draftJson: payload });
      const review = await adminClient.publicationExperienceReview(editingExperience.id);
      setExperienceReview(review);
      setMessage(`Borrador de experiencia guardado: ${payload.company}.`);
    } catch {
      setMessage("No se pudo guardar el borrador de experiencia.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function reviewEditingDraft() {
    if (!editingExperience) {
      return;
    }

    setBusyId(editingExperience.id);
    try {
      const review = await adminClient.publicationExperienceReview(editingExperience.id);
      setExperienceReview(review);
      setMessage(review.hasDraft ? "Borrador de experiencia pendiente de publicacion." : "No hay borrador de experiencia pendiente.");
    } catch {
      setMessage("No se pudo revisar el borrador de experiencia.");
    } finally {
      setBusyId(null);
    }
  }

  async function publishEditingDraft() {
    if (!editingExperience) {
      return;
    }

    setIsPublishingDraft(true);
    try {
      const result = await adminClient.publishExperienceDraft(editingExperience.id);
      setExperienceReview(null);
      setEditingExperience(null);
      await loadExperiences();
      setMessage(`Borrador de experiencia publicado. Campos modificados: ${result.changedFields.join(", ")}.`);
    } catch {
      setMessage("No se pudo publicar el borrador de experiencia.");
    } finally {
      setIsPublishingDraft(false);
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
        <ListQuickPicker
          label="Asociar skills registradas"
          options={skillOptions}
          value={draft.skills}
          onChange={(value) => setDraft((current) => ({ ...current, skills: value }))}
        />
        <ListQuickPicker
          label="Asociar tecnologias usadas"
          options={technologyOptions}
          value={draft.technologies}
          onChange={(value) => setDraft((current) => ({ ...current, technologies: value }))}
        />
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
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[40px_1.3fr_1.3fr_140px_130px_280px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span aria-hidden="true" />
            <span>Empresa</span>
            <span>Cargo</span>
            <span>Fechas</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-[40px_1.3fr_1.3fr_140px_130px_280px] gap-3 border-b border-border p-3 text-sm last:border-b-0"
              data-cms-experience-id={item.id}
              draggable={busyId !== item.id}
              onDragStart={() => setDraggedExperienceIndex(index)}
              onDragEnd={() => setDraggedExperienceIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleExperienceDrop(index)}
            >
              <span className="flex items-center text-muted-foreground" aria-hidden="true">
                <GripVertical className="h-4 w-4" />
              </span>
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
                <Button type="button" variant="outline" size="icon" aria-label={`Subir ${item.company}`} onClick={() => patchExperience(item.id, { order: item.order - 1 }, `Experiencia reordenada: ${item.company}.`)} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Bajar ${item.company}`} onClick={() => patchExperience(item.id, { order: item.order + 1 }, `Experiencia reordenada: ${item.company}.`)} disabled={busyId === item.id}>
                  <ArrowDown />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:!max-w-4xl">
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
            <ListQuickPicker
              label="Asociar skills registradas"
              options={skillOptions}
              value={editDraft.skills}
              onChange={(value) => setEditDraft((current) => ({ ...current, skills: value }))}
            />
            <ListQuickPicker
              label="Asociar tecnologias usadas"
              options={technologyOptions}
              value={editDraft.technologies}
              onChange={(value) => setEditDraft((current) => ({ ...current, technologies: value }))}
            />
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
          {experienceReview ? (
            <section className="grid gap-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Revision borrador experiencia</h3>
                  <p className="text-sm text-muted-foreground">
                    {experienceReview.hasDraft ? "Cambios pendientes antes de publicar." : "Sin cambios pendientes."}
                  </p>
                </div>
                <Badge variant={experienceReview.hasDraft ? "default" : "outline"}>
                  {experienceReview.fields.filter((field) => field.changed).length} cambios
                </Badge>
              </div>
              <div className="grid gap-2">
                {experienceReview.fields.filter((field) => field.changed).slice(0, 6).map((field) => (
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
            <Button type="button" variant="outline" onClick={() => setEditingExperience(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={saveEditingDraft} disabled={isSavingDraft}>
              <Save data-icon="inline-start" />
              {isSavingDraft ? "Guardando borrador..." : "Guardar borrador"}
            </Button>
            <Button type="button" variant="outline" onClick={reviewEditingDraft} disabled={Boolean(editingExperience && busyId === editingExperience.id)}>
              Revisar borrador
            </Button>
            <Button type="button" onClick={publishEditingDraft} disabled={!experienceReview?.hasDraft || isPublishingDraft}>
              <Rocket data-icon="inline-start" />
              {isPublishingDraft ? "Publicando..." : "Publicar borrador"}
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

function ListQuickPicker({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (!options.length) {
    return null;
  }

  const selected = new Set(splitList(value).map((item) => item.toLowerCase()));

  return (
    <div className="grid gap-2 lg:col-span-2 md:col-span-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.has(option.toLowerCase());
          return (
            <Button key={option} type="button" variant={isSelected ? "default" : "outline"} size="sm" onClick={() => onChange(toggleListValue(value, option))}>
              {option}
            </Button>
          );
        })}
      </div>
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
