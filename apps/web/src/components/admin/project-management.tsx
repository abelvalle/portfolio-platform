"use client";

import { useEffect, useState } from "react";
import { Archive, ArrowDown, ArrowUp, Eye, EyeOff, Pencil, RefreshCw, Save, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, type ProjectCategoryItem, type ProjectItem, type ProjectMutation } from "@/lib/api";

type ProjectDraft = {
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  categoryName: string;
  technologies: string;
  imageUrl: string;
  publicUrl: string;
  repositoryUrl: string;
  visible: boolean;
  featured: boolean;
  sample: boolean;
};

const emptyDraft: ProjectDraft = {
  name: "",
  description: "",
  status: "draft",
  categoryName: "",
  technologies: "",
  imageUrl: "",
  publicUrl: "",
  repositoryUrl: "",
  visible: true,
  featured: false,
  sample: false
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitList(value: string) {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function buildMutation(draft: ProjectDraft, order: number): ProjectMutation {
  return {
    name: draft.name.trim(),
    slug: slugify(draft.name.trim()),
    description: draft.description.trim(),
    status: draft.status,
    categoryName: draft.categoryName.trim() || null,
    technologies: splitList(draft.technologies),
    imageUrl: draft.imageUrl.trim() || null,
    publicUrl: draft.publicUrl.trim() || null,
    repositoryUrl: draft.repositoryUrl.trim() || null,
    featured: draft.featured,
    visible: draft.visible,
    sample: draft.sample,
    order
  };
}

function projectToDraft(project: ProjectItem): ProjectDraft {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    categoryName: project.categoryName || "",
    technologies: project.technologies.join("\n"),
    imageUrl: project.imageUrl || "",
    publicUrl: project.publicUrl || "",
    repositoryUrl: project.repositoryUrl || "",
    visible: project.visible,
    featured: project.featured,
    sample: project.sample
  };
}

export function ProjectManagement() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [categories, setCategories] = useState<ProjectCategoryItem[]>([]);
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [categoryDraft, setCategoryDraft] = useState({ name: "", order: 0, visible: true });
  const [message, setMessage] = useState("Cargando proyectos.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] = useState<ProjectItem | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [editDraft, setEditDraft] = useState<ProjectDraft>(emptyDraft);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProjects();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const [nextItems, nextCategories] = await Promise.all([
        adminClient.projects(),
        adminClient.projectCategories()
      ]);
      setItems(nextItems);
      setCategories(nextCategories);
      setMessage(nextItems.length ? "Proyectos sincronizados con la API." : "Sin proyectos registrados.");
    } catch {
      setMessage("No se pudieron cargar proyectos. Comprueba la sesion admin.");
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
      await adminClient.createProjectCategory(payload);
      setCategoryDraft({ name: "", order: categories.length, visible: true });
      await loadProjects();
      setMessage(`Categoria creada: ${payload.name}.`);
    } catch {
      setMessage("No se pudo crear la categoria.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCategory(category: ProjectCategoryItem) {
    setBusyId(`category:${category.id}`);
    try {
      await adminClient.updateProjectCategory(category.id, { visible: !category.visible });
      await loadProjects();
      setMessage(`Categoria ${category.visible ? "ocultada" : "mostrada"}: ${category.name}.`);
    } catch {
      setMessage("No se pudo actualizar la categoria.");
    } finally {
      setBusyId(null);
    }
  }

  async function createProject() {
    const payload = buildMutation(draft, items.length);
    if (!payload.name || !payload.slug || !payload.description) {
      setMessage("Nombre y descripcion son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await adminClient.createProject(payload);
      setDraft(emptyDraft);
      setMessage("Proyecto creado.");
      await loadProjects();
    } catch {
      setMessage("No se pudo crear el proyecto.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchProject(id: string, data: Partial<ProjectMutation>, successMessage = "Proyecto actualizado.") {
    setBusyId(id);
    try {
      await adminClient.updateProject(id, data);
      await loadProjects();
      setMessage(successMessage);
    } catch {
      setMessage("No se pudo actualizar el proyecto.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteProject(project: ProjectItem) {
    setBusyId(project.id);
    try {
      await adminClient.deleteProject(project.id);
      setPendingDeleteProject(null);
      setMessage(`Proyecto eliminado: ${project.name}.`);
      await loadProjects();
    } catch {
      setMessage("No se pudo eliminar el proyecto.");
    } finally {
      setBusyId(null);
    }
  }

  function openEditProject(project: ProjectItem) {
    setEditingProject(project);
    setEditDraft(projectToDraft(project));
  }

  async function updateEditingProject() {
    if (!editingProject) {
      return;
    }
    const payload = buildMutation(editDraft, editingProject.order);
    if (!payload.name || !payload.slug || !payload.description) {
      setMessage("Nombre y descripcion son obligatorios.");
      return;
    }

    setBusyId(editingProject.id);
    try {
      await adminClient.updateProject(editingProject.id, payload);
      setEditingProject(null);
      await loadProjects();
      setMessage(`Proyecto actualizado: ${payload.name}.`);
    } catch {
      setMessage("No se pudo actualizar el proyecto.");
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
            <h1 className="mt-2 text-3xl font-semibold">Proyectos</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              CRUD basico conectado a la API para proyectos publicados, destacados y demo.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadProjects} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-60 flex-1 gap-2">
            <Label htmlFor="projectCategoryName">Categoria nueva</Label>
            <Input id="projectCategoryName" value={categoryDraft.name} onChange={(event) => setCategoryDraft((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="grid w-28 gap-2">
            <Label htmlFor="projectCategoryOrder">Orden</Label>
            <Input id="projectCategoryOrder" type="number" value={categoryDraft.order} onChange={(event) => setCategoryDraft((current) => ({ ...current, order: Number(event.target.value) }))} />
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

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5 lg:grid-cols-2">
        <datalist id="projectCategoryOptions">
          {categories.map((category) => (
            <option key={category.id} value={category.name} />
          ))}
        </datalist>
        <div className="grid gap-2">
          <Label htmlFor="projectName">Nombre</Label>
          <Input id="projectName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categoryName">Categoria</Label>
          <Input id="categoryName" list="projectCategoryOptions" value={draft.categoryName} onChange={(event) => setDraft((current) => ({ ...current, categoryName: event.target.value }))} />
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="projectDescription">Descripcion</Label>
          <Textarea id="projectDescription" rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="technologies">Tecnologias</Label>
          <Textarea id="technologies" rows={3} value={draft.technologies} onChange={(event) => setDraft((current) => ({ ...current, technologies: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="imageUrl">Imagen</Label>
          <Input id="imageUrl" value={draft.imageUrl} onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="publicUrl">URL publica</Label>
          <Input id="publicUrl" value={draft.publicUrl} onChange={(event) => setDraft((current) => ({ ...current, publicUrl: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repositoryUrl">Repositorio</Label>
          <Input id="repositoryUrl" value={draft.repositoryUrl} onChange={(event) => setDraft((current) => ({ ...current, repositoryUrl: event.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          {(["draft", "published", "archived"] as const).map((status) => (
            <Button key={status} type="button" variant={draft.status === status ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, status }))}>
              {status}
            </Button>
          ))}
          <Button type="button" variant={draft.visible ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, visible: !current.visible }))}>
            Visible
          </Button>
          <Button type="button" variant={draft.featured ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, featured: !current.featured }))}>
            Destacado
          </Button>
          <Button type="button" variant={draft.sample ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, sample: !current.sample }))}>
            Demo
          </Button>
          <Button type="button" onClick={createProject} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Crear proyecto"}
          </Button>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[1.2fr_1fr_130px_140px_300px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Proyecto</span>
            <span>Categoria</span>
            <span>Estado</span>
            <span>Flags</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.2fr_1fr_130px_140px_300px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span>
                <span className="block font-medium">{item.name}</span>
                <span className="block text-muted-foreground">{item.slug}</span>
              </span>
              <span className="text-muted-foreground">{item.categoryName || "-"}</span>
              <span><Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status}</Badge></span>
              <span className="flex flex-wrap gap-1">
                <Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "visible" : "oculto"}</Badge>
                {item.featured ? <Badge variant="outline">destacado</Badge> : null}
                {item.sample ? <Badge variant="outline">demo</Badge> : null}
              </span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" aria-label={`Editar ${item.name}`} onClick={() => openEditProject(item)} disabled={busyId === item.id}>
                  <Pencil />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchProject(item.id, { visible: !item.visible })} disabled={busyId === item.id}>
                  {item.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchProject(item.id, { featured: !item.featured })} disabled={busyId === item.id}>
                  <Star />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchProject(item.id, { status: item.status === "published" ? "archived" : "published" })} disabled={busyId === item.id}>
                  <Archive />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Subir ${item.name}`} onClick={() => patchProject(item.id, { order: item.order - 1 }, `Proyecto reordenado: ${item.name}.`)} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Bajar ${item.name}`} onClick={() => patchProject(item.id, { order: item.order + 1 }, `Proyecto reordenado: ${item.name}.`)} disabled={busyId === item.id}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label={`Eliminar ${item.name}`} onClick={() => setPendingDeleteProject(item)} disabled={busyId === item.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin proyectos registrados.</div>
          )}
        </div>
      </section>

      <Dialog open={Boolean(editingProject)} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
            <DialogDescription>
              Actualiza contenido, enlaces, categoria, estado y visibilidad del proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="editProjectName">Nombre proyecto</Label>
              <Input id="editProjectName" value={editDraft.name} onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProjectCategory">Categoria proyecto</Label>
              <Input id="editProjectCategory" list="projectCategoryOptions" value={editDraft.categoryName} onChange={(event) => setEditDraft((current) => ({ ...current, categoryName: event.target.value }))} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="editProjectDescription">Descripcion proyecto</Label>
              <Textarea id="editProjectDescription" rows={4} value={editDraft.description} onChange={(event) => setEditDraft((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProjectTechnologies">Tecnologias proyecto</Label>
              <Textarea id="editProjectTechnologies" rows={3} value={editDraft.technologies} onChange={(event) => setEditDraft((current) => ({ ...current, technologies: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProjectImage">Imagen proyecto</Label>
              <Input id="editProjectImage" value={editDraft.imageUrl} onChange={(event) => setEditDraft((current) => ({ ...current, imageUrl: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProjectPublicUrl">URL publica proyecto</Label>
              <Input id="editProjectPublicUrl" value={editDraft.publicUrl} onChange={(event) => setEditDraft((current) => ({ ...current, publicUrl: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editProjectRepositoryUrl">Repositorio proyecto</Label>
              <Input id="editProjectRepositoryUrl" value={editDraft.repositoryUrl} onChange={(event) => setEditDraft((current) => ({ ...current, repositoryUrl: event.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              {(["draft", "published", "archived"] as const).map((status) => (
                <Button key={status} type="button" variant={editDraft.status === status ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, status }))}>
                  {status}
                </Button>
              ))}
              <Button type="button" variant={editDraft.visible ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, visible: !current.visible }))}>
                Visible
              </Button>
              <Button type="button" variant={editDraft.featured ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, featured: !current.featured }))}>
                Destacado
              </Button>
              <Button type="button" variant={editDraft.sample ? "default" : "outline"} onClick={() => setEditDraft((current) => ({ ...current, sample: !current.sample }))}>
                Demo
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={updateEditingProject} disabled={Boolean(editingProject && busyId === editingProject.id)}>
              Guardar proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(pendingDeleteProject)} onOpenChange={(open) => !open && setPendingDeleteProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar borrado</DialogTitle>
            <DialogDescription>
              Esta accion eliminara el proyecto {pendingDeleteProject?.name}. Puedes ocultarlo o archivarlo si solo quieres retirarlo de la landing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteProject(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteProject && deleteProject(pendingDeleteProject)}>
              Eliminar proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
