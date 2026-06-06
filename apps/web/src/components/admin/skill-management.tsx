"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, RefreshCw, Rocket, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClient, type PublicationSkillReview, type SkillCategoryItem, type SkillItem, type SkillMutation } from "@/lib/api";

const emptyDraft = {
  name: "",
  categoryName: "",
  level: "",
  order: 0,
  visible: true
};
const skillLevelOptions = ["", "Basico", "Intermedio", "Avanzado", "Experto"];

function buildSkillMutation(source: typeof emptyDraft, order: number): SkillMutation {
  return {
    name: source.name.trim(),
    categoryName: source.categoryName.trim() || null,
    level: source.level.trim() || null,
    order,
    visible: source.visible
  };
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

export function SkillManagement() {
  const [items, setItems] = useState<SkillItem[]>([]);
  const [categories, setCategories] = useState<SkillCategoryItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [categoryDraft, setCategoryDraft] = useState({ name: "", order: 0, visible: true });
  const [message, setMessage] = useState("Cargando skills.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteSkill, setPendingDeleteSkill] = useState<SkillItem | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [skillReview, setSkillReview] = useState<PublicationSkillReview | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishingDraft, setIsPublishingDraft] = useState(false);
  const [draggedSkillIndex, setDraggedSkillIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSkills();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadSkills() {
    setIsLoading(true);
    try {
      const [nextItems, nextCategories] = await Promise.all([
        adminClient.skills(),
        adminClient.skillCategories()
      ]);
      setItems(nextItems);
      setCategories(nextCategories);
      setMessage(nextItems.length ? "Skills sincronizadas con la API." : "Sin skills registradas.");
    } catch {
      setMessage("No se pudieron cargar skills. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createCategory() {
    const payload = {
      name: categoryDraft.name.trim(),
      order: categoryDraft.order,
      visible: categoryDraft.visible
    };
    if (!payload.name) {
      setMessage("Nombre de categoria obligatorio.");
      return;
    }

    setIsSaving(true);
    try {
      await adminClient.createSkillCategory(payload);
      setCategoryDraft({ name: "", order: categories.length, visible: true });
      await loadSkills();
      setMessage(`Categoria creada: ${payload.name}.`);
    } catch {
      setMessage("No se pudo crear la categoria.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCategory(category: SkillCategoryItem) {
    setBusyId(`category:${category.id}`);
    try {
      await adminClient.updateSkillCategory(category.id, { visible: !category.visible });
      await loadSkills();
      setMessage(`Categoria ${category.visible ? "ocultada" : "mostrada"}: ${category.name}.`);
    } catch {
      setMessage("No se pudo actualizar la categoria.");
    } finally {
      setBusyId(null);
    }
  }

  function buildMutation(order = items.length): SkillMutation {
    return buildSkillMutation(draft, order);
  }

  async function createSkill() {
    const payload = buildMutation(items.length);
    if (!payload.name || !payload.categoryName) {
      setMessage("Nombre y categoria son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await adminClient.createSkill(payload);
      setDraft(emptyDraft);
      setMessage("Skill creada.");
      await loadSkills();
    } catch {
      setMessage("No se pudo crear la skill.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchSkill(id: string, data: Partial<SkillMutation>, successMessage = "Skill actualizada.") {
    setBusyId(id);
    try {
      await adminClient.updateSkill(id, data);
      await loadSkills();
      setMessage(successMessage);
    } catch {
      setMessage("No se pudo actualizar la skill.");
    } finally {
      setBusyId(null);
    }
  }

  function moveSkillToIndex(fromIndex: number, toIndex: number) {
    const item = items[fromIndex];
    if (!item || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
      return;
    }
    const direction = toIndex > fromIndex ? 1 : -1;
    void patchSkill(item.id, { order: item.order + direction }, `Skill reordenada: ${item.name}.`);
  }

  function handleSkillDrop(toIndex: number) {
    if (draggedSkillIndex === null) {
      return;
    }
    moveSkillToIndex(draggedSkillIndex, toIndex);
    setDraggedSkillIndex(null);
  }

  async function deleteSkill(skill: SkillItem) {
    setBusyId(skill.id);
    try {
      await adminClient.deleteSkill(skill.id);
      setPendingDeleteSkill(null);
      setMessage(`Skill eliminada: ${skill.name}.`);
      await loadSkills();
    } catch {
      setMessage("No se pudo eliminar la skill.");
    } finally {
      setBusyId(null);
    }
  }

  function openEditSkill(skill: SkillItem) {
    setEditingSkill(skill);
    setEditDraft({
      name: skill.name,
      categoryName: skill.categoryName || "",
      level: skill.level || "",
      order: skill.order,
      visible: skill.visible
    });
    setSkillReview(null);
  }

  function closeEditSkill() {
    setEditingSkill(null);
    setSkillReview(null);
  }

  async function updateEditingSkill() {
    if (!editingSkill) {
      return;
    }
    const payload = buildSkillMutation(editDraft, editDraft.order);
    if (!payload.name || !payload.categoryName) {
      setMessage("Nombre y categoria son obligatorios.");
      return;
    }

    setBusyId(editingSkill.id);
    try {
      await adminClient.updateSkill(editingSkill.id, payload);
      closeEditSkill();
      await loadSkills();
      setMessage(`Skill actualizada: ${payload.name}.`);
    } catch {
      setMessage("No se pudo actualizar la skill.");
    } finally {
      setBusyId(null);
    }
  }

  async function saveEditingDraft() {
    if (!editingSkill) {
      return;
    }
    const payload = buildSkillMutation(editDraft, editDraft.order);
    if (!payload.name || !payload.categoryName) {
      setMessage("Nombre y categoria son obligatorios.");
      return;
    }

    setIsSavingDraft(true);
    try {
      await adminClient.updateSkill(editingSkill.id, { draftJson: payload });
      const review = await adminClient.publicationSkillReview(editingSkill.id);
      setSkillReview(review);
      setMessage(`Borrador de skill guardado: ${payload.name}.`);
    } catch {
      setMessage("No se pudo guardar el borrador de skill.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function reviewEditingDraft() {
    if (!editingSkill) {
      return;
    }

    setBusyId(editingSkill.id);
    try {
      const review = await adminClient.publicationSkillReview(editingSkill.id);
      setSkillReview(review);
      setMessage(review.hasDraft ? "Borrador de skill pendiente de publicacion." : "No hay borrador de skill pendiente.");
    } catch {
      setMessage("No se pudo revisar el borrador de skill.");
    } finally {
      setBusyId(null);
    }
  }

  async function publishEditingDraft() {
    if (!editingSkill) {
      return;
    }

    setIsPublishingDraft(true);
    try {
      const result = await adminClient.publishSkillDraft(editingSkill.id);
      closeEditSkill();
      await loadSkills();
      setMessage(`Borrador de skill publicado. Campos modificados: ${result.changedFields.join(", ")}.`);
    } catch {
      setMessage("No se pudo publicar el borrador de skill.");
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
            <h1 className="mt-2 text-3xl font-semibold">Skills</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              CRUD basico conectado a la API para skills, categorias y orden.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadSkills} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-60 flex-1 gap-2">
            <Label htmlFor="skillCategoryName">Categoria nueva</Label>
            <Input id="skillCategoryName" value={categoryDraft.name} onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="grid w-28 gap-2">
            <Label htmlFor="skillCategoryOrder">Orden</Label>
            <Input id="skillCategoryOrder" type="number" value={categoryDraft.order} onChange={(event) => setCategoryDraft((current) => ({ ...current, order: Number(event.target.value) }))} />
          </div>
          <Button type="button" onClick={createCategory} disabled={isSaving}>
            <Save data-icon="inline-start" />
            Crear categoria
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.length ? categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={category.visible ? "outline" : "secondary"}
              onClick={() => toggleCategory(category)}
              disabled={busyId === `category:${category.id}`}
            >
              {category.name}
              <Badge variant={category.visible ? "default" : "secondary"}>{category.visible ? "visible" : "oculta"}</Badge>
            </Button>
          )) : (
            <p className="text-sm text-muted-foreground">Sin categorias registradas.</p>
          )}
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-4">
        <datalist id="skillCategoryOptions">
          {categories.map((category) => (
            <option key={category.id} value={category.name} />
          ))}
        </datalist>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="skillName">Nombre</Label>
          <Input id="skillName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="skillCategory">Categoria</Label>
          <Input id="skillCategory" list="skillCategoryOptions" value={draft.categoryName} onChange={(event) => setDraft((current) => ({ ...current, categoryName: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="skillLevel">Nivel</Label>
          <select
            id="skillLevel"
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={draft.level}
            onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value }))}
          >
            {skillLevelOptions.map((level) => (
              <option key={level || "empty"} value={level}>{level || "Sin nivel"}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-4">
          <Button type="button" variant={draft.visible ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, visible: !current.visible }))}>
            Visible
          </Button>
          <Button type="button" onClick={createSkill} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Crear skill"}
          </Button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[40px_1.2fr_1fr_120px_120px_220px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span aria-hidden="true" />
            <span>Nombre</span>
            <span>Categoria</span>
            <span>Nivel</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item, index) => (
            <div
              key={item.id}
              className="grid grid-cols-[40px_1.2fr_1fr_120px_120px_220px] gap-3 border-b border-border p-3 text-sm last:border-b-0"
              data-cms-skill-id={item.id}
              draggable={busyId !== item.id}
              onDragStart={() => setDraggedSkillIndex(index)}
              onDragEnd={() => setDraggedSkillIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleSkillDrop(index)}
            >
              <span className="flex items-center text-muted-foreground" aria-hidden="true">
                <GripVertical className="h-4 w-4" />
              </span>
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">{item.categoryName || "-"}</span>
              <span className="text-muted-foreground">{item.level || "-"}</span>
              <span><Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "visible" : "oculta"}</Badge></span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" aria-label={`Editar ${item.name}`} onClick={() => openEditSkill(item)} disabled={busyId === item.id}>
                  <Pencil />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchSkill(item.id, { visible: !item.visible })} disabled={busyId === item.id}>
                  {item.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Subir ${item.name}`} onClick={() => patchSkill(item.id, { order: item.order - 1 }, `Skill reordenada: ${item.name}.`)} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Bajar ${item.name}`} onClick={() => patchSkill(item.id, { order: item.order + 1 }, `Skill reordenada: ${item.name}.`)} disabled={busyId === item.id}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Eliminar ${item.name}`} onClick={() => setPendingDeleteSkill(item)} disabled={busyId === item.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin skills registradas.</div>
          )}
        </div>
      </section>

      <Dialog open={Boolean(editingSkill)} onOpenChange={(open) => !open && closeEditSkill()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:!max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar skill</DialogTitle>
            <DialogDescription>
              Actualiza nombre, categoria, nivel, orden y visibilidad de la skill.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="editSkillName">Nombre skill</Label>
              <Input id="editSkillName" value={editDraft.name} onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editSkillCategory">Categoria skill</Label>
              <Input id="editSkillCategory" list="skillCategoryOptions" value={editDraft.categoryName} onChange={(event) => setEditDraft((current) => ({ ...current, categoryName: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editSkillLevel">Nivel skill</Label>
              <select
                id="editSkillLevel"
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                value={editDraft.level}
                onChange={(event) => setEditDraft((current) => ({ ...current, level: event.target.value }))}
              >
                {skillLevelOptions.map((level) => (
                  <option key={level || "empty"} value={level}>{level || "Sin nivel"}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editSkillOrder">Orden skill</Label>
              <Input id="editSkillOrder" type="number" value={editDraft.order} onChange={(event) => setEditDraft((current) => ({ ...current, order: Number(event.target.value) }))} />
            </div>
            <Button type="button" variant={editDraft.visible ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, visible: !current.visible }))}>
              {editDraft.visible ? "Visible" : "Oculta"}
            </Button>
          </div>
          {skillReview ? (
            <section className="grid gap-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Revision borrador skill</h3>
                  <p className="text-sm text-muted-foreground">
                    {skillReview.hasDraft ? "Cambios pendientes antes de publicar." : "Sin cambios pendientes."}
                  </p>
                </div>
                <Badge variant={skillReview.hasDraft ? "default" : "outline"}>
                  {skillReview.fields.filter((field) => field.changed).length} cambios
                </Badge>
              </div>
              <div className="grid gap-2">
                {skillReview.fields.filter((field) => field.changed).slice(0, 6).map((field) => (
                  <div key={field.field} className="grid gap-1 rounded-md bg-muted/40 p-2 text-sm md:grid-cols-[120px_1fr_1fr]">
                    <span className="font-medium">{field.field}</span>
                    <span className="truncate text-muted-foreground">{formatPublicationValue(field.before)}</span>
                    <span className="truncate">{formatPublicationValue(field.after)}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <DialogFooter className="flex-wrap">
            <Button type="button" variant="outline" onClick={closeEditSkill}>
              Cancelar
            </Button>
            <Button type="button" variant="outline" onClick={saveEditingDraft} disabled={isSavingDraft}>
              <Save data-icon="inline-start" />
              {isSavingDraft ? "Guardando borrador..." : "Guardar borrador"}
            </Button>
            <Button type="button" variant="outline" onClick={reviewEditingDraft} disabled={Boolean(editingSkill && busyId === editingSkill.id)}>
              Revisar borrador
            </Button>
            <Button type="button" onClick={publishEditingDraft} disabled={!skillReview?.hasDraft || isPublishingDraft}>
              <Rocket data-icon="inline-start" />
              {isPublishingDraft ? "Publicando..." : "Publicar borrador"}
            </Button>
            <Button type="button" onClick={updateEditingSkill} disabled={Boolean(editingSkill && busyId === editingSkill.id)}>
              Guardar skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteSkill)} onOpenChange={(open) => !open && setPendingDeleteSkill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar borrado</DialogTitle>
            <DialogDescription>
              Esta accion eliminara la skill {pendingDeleteSkill?.name}. Puedes ocultarla si solo quieres retirarla de la landing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteSkill(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteSkill && deleteSkill(pendingDeleteSkill)}>
              Eliminar skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
