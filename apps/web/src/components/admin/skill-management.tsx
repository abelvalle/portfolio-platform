"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminClient, type SkillItem, type SkillMutation } from "@/lib/api";

const emptyDraft = {
  name: "",
  categoryName: "",
  level: "",
  order: 0,
  visible: true
};

export function SkillManagement() {
  const [items, setItems] = useState<SkillItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando skills.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteSkill, setPendingDeleteSkill] = useState<SkillItem | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillItem | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSkills();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadSkills() {
    setIsLoading(true);
    try {
      const nextItems = await adminClient.skills();
      setItems(nextItems);
      setMessage(nextItems.length ? "Skills sincronizadas con la API." : "Sin skills registradas.");
    } catch {
      setMessage("No se pudieron cargar skills. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  function buildMutation(order = items.length): SkillMutation {
    return {
      name: draft.name.trim(),
      categoryName: draft.categoryName.trim() || null,
      level: draft.level.trim() || null,
      order,
      visible: draft.visible
    };
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

  async function patchSkill(id: string, data: Partial<SkillMutation>) {
    setBusyId(id);
    try {
      await adminClient.updateSkill(id, data);
      setMessage("Skill actualizada.");
      await loadSkills();
    } catch {
      setMessage("No se pudo actualizar la skill.");
    } finally {
      setBusyId(null);
    }
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
  }

  async function updateEditingSkill() {
    if (!editingSkill) {
      return;
    }
    const payload = {
      name: editDraft.name.trim(),
      categoryName: editDraft.categoryName.trim() || null,
      level: editDraft.level.trim() || null,
      order: editDraft.order,
      visible: editDraft.visible
    };
    if (!payload.name || !payload.categoryName) {
      setMessage("Nombre y categoria son obligatorios.");
      return;
    }

    setBusyId(editingSkill.id);
    try {
      await adminClient.updateSkill(editingSkill.id, payload);
      setEditingSkill(null);
      await loadSkills();
      setMessage(`Skill actualizada: ${payload.name}.`);
    } catch {
      setMessage("No se pudo actualizar la skill.");
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

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 md:grid-cols-4">
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="skillName">Nombre</Label>
          <Input id="skillName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="skillCategory">Categoria</Label>
          <Input id="skillCategory" value={draft.categoryName} onChange={(event) => setDraft((current) => ({ ...current, categoryName: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="skillLevel">Nivel</Label>
          <Input id="skillLevel" value={draft.level} onChange={(event) => setDraft((current) => ({ ...current, level: event.target.value }))} />
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
          <div className="grid grid-cols-[1.2fr_1fr_120px_120px_220px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Nombre</span>
            <span>Categoria</span>
            <span>Nivel</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.2fr_1fr_120px_120px_220px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
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
                <Button type="button" variant="outline" size="icon" onClick={() => patchSkill(item.id, { order: item.order - 1 })} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchSkill(item.id, { order: item.order + 1 })} disabled={busyId === item.id}>
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

      <Dialog open={Boolean(editingSkill)} onOpenChange={(open) => !open && setEditingSkill(null)}>
        <DialogContent>
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
              <Input id="editSkillCategory" value={editDraft.categoryName} onChange={(event) => setEditDraft((current) => ({ ...current, categoryName: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editSkillLevel">Nivel skill</Label>
              <Input id="editSkillLevel" value={editDraft.level} onChange={(event) => setEditDraft((current) => ({ ...current, level: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editSkillOrder">Orden skill</Label>
              <Input id="editSkillOrder" type="number" value={editDraft.order} onChange={(event) => setEditDraft((current) => ({ ...current, order: Number(event.target.value) }))} />
            </div>
            <Button type="button" variant={editDraft.visible ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, visible: !current.visible }))}>
              {editDraft.visible ? "Visible" : "Oculta"}
            </Button>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingSkill(null)}>
              Cancelar
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
