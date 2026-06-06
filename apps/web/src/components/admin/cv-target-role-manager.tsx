"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, type CvTargetRoleItem, type CvTargetRoleMutation } from "@/lib/api";

type TargetRoleDraft = {
  name: string;
  description: string;
  keywords: string;
};

const emptyDraft: TargetRoleDraft = {
  name: "",
  description: "",
  keywords: ""
};

function keywordsFromText(value: string) {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function draftFromRole(role: CvTargetRoleItem): TargetRoleDraft {
  return {
    name: role.name,
    description: role.description || "",
    keywords: role.keywords.join("\n")
  };
}

function mutationFromDraft(draft: TargetRoleDraft): CvTargetRoleMutation {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    keywords: keywordsFromText(draft.keywords)
  };
}

export function CvTargetRoleManager() {
  const [roles, setRoles] = useState<CvTargetRoleItem[]>([]);
  const [edits, setEdits] = useState<Record<string, TargetRoleDraft>>({});
  const [draft, setDraft] = useState<TargetRoleDraft>(emptyDraft);
  const [message, setMessage] = useState("Cargando roles objetivo.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRoles();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadRoles(nextMessage?: string) {
    setIsLoading(true);
    try {
      const nextRoles = await cvClient.targetRoles();
      setRoles(nextRoles);
      setEdits(Object.fromEntries(nextRoles.map((role) => [role.id, draftFromRole(role)])));
      setMessage(nextMessage || (nextRoles.length ? "Roles objetivo sincronizados con la API." : "Sin roles objetivo registrados."));
    } catch {
      setMessage("No se pudieron cargar los roles objetivo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createRole() {
    const payload = mutationFromDraft(draft);
    if (!payload.name || !payload.keywords.length) {
      setMessage("Nombre y al menos una keyword son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      await cvClient.createTargetRole(payload);
      setDraft(emptyDraft);
      await loadRoles(`Rol objetivo creado: ${payload.name}.`);
    } catch {
      setMessage("No se pudo crear el rol objetivo.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateRole(role: CvTargetRoleItem) {
    const payload = mutationFromDraft(edits[role.id] || draftFromRole(role));
    if (!payload.name || !payload.keywords.length) {
      setMessage("Nombre y keywords son obligatorios para guardar.");
      return;
    }

    setBusyId(role.id);
    try {
      await cvClient.updateTargetRole(role.id, payload);
      await loadRoles(`Rol objetivo actualizado: ${payload.name}.`);
    } catch {
      setMessage("No se pudo actualizar el rol objetivo.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRole(role: CvTargetRoleItem) {
    setBusyId(role.id);
    try {
      await cvClient.deleteTargetRole(role.id);
      await loadRoles(`Rol objetivo archivado: ${role.name}.`);
    } catch {
      setMessage("No se pudo archivar el rol objetivo.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">CV Manager</p>
            <h1 className="mt-2 text-3xl font-semibold">Roles objetivo CV</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Gestiona perfiles objetivo y keywords para preparar adaptaciones de CV.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void loadRoles()} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-5 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="targetRoleName">Nombre rol</Label>
          <Input id="targetRoleName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="targetRoleKeywords">Keywords rol</Label>
          <Textarea id="targetRoleKeywords" rows={4} value={draft.keywords} onChange={(event) => setDraft((current) => ({ ...current, keywords: event.target.value }))} placeholder={"delivery\nuat\nkpi"} />
        </div>
        <div className="grid gap-2 lg:col-span-2">
          <Label htmlFor="targetRoleDescription">Descripcion rol</Label>
          <Textarea id="targetRoleDescription" rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        </div>
        <div className="lg:col-span-2">
          <Button type="button" onClick={createRole} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Creando..." : "Crear rol objetivo"}
          </Button>
        </div>
      </section>

      <section className="grid gap-4">
        {roles.length ? roles.map((role) => {
          const edit = edits[role.id] || draftFromRole(role);
          return (
            <div key={role.id} className="grid gap-4 rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{role.name}</h2>
                  <p className="text-sm text-muted-foreground">{role.description || "Sin descripcion."}</p>
                </div>
                <Badge variant="outline">{role.keywords.length} keywords</Badge>
              </div>
              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="grid gap-2">
                  <Label htmlFor={`roleName-${role.id}`}>Nombre de {role.name}</Label>
                  <Input id={`roleName-${role.id}`} value={edit.name} onChange={(event) => setEdits((current) => ({ ...current, [role.id]: { ...edit, name: event.target.value } }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`roleKeywords-${role.id}`}>Keywords de {role.name}</Label>
                  <Textarea id={`roleKeywords-${role.id}`} rows={3} value={edit.keywords} onChange={(event) => setEdits((current) => ({ ...current, [role.id]: { ...edit, keywords: event.target.value } }))} />
                </div>
                <div className="grid gap-2 lg:col-span-2">
                  <Label htmlFor={`roleDescription-${role.id}`}>Descripcion de {role.name}</Label>
                  <Textarea id={`roleDescription-${role.id}`} rows={2} value={edit.description} onChange={(event) => setEdits((current) => ({ ...current, [role.id]: { ...edit, description: event.target.value } }))} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => updateRole(role)} disabled={busyId === role.id}>
                  <Save data-icon="inline-start" />
                  Guardar rol
                </Button>
                <Button type="button" variant="outline" onClick={() => deleteRole(role)} disabled={busyId === role.id}>
                  <Trash2 data-icon="inline-start" />
                  Archivar rol
                </Button>
              </div>
            </div>
          );
        }) : (
          <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">Sin roles objetivo.</div>
        )}
      </section>
    </div>
  );
}
