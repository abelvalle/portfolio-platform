"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Search, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminClient, type AdminUser, type AdminUserRole } from "@/lib/api";

const roles: AdminUserRole[] = ["admin", "editor", "viewer"];

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Record<AdminUserRole, string[]> | null>(null);
  const [message, setMessage] = useState("Cargando usuarios.");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [draftUser, setDraftUser] = useState({ email: "", name: "", role: "viewer" as AdminUserRole, password: "" });
  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminUserRole>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingDeleteUser, setPendingDeleteUser] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.email, user.name || "", user.role].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchTerm, users]);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const [nextUsers, nextPermissions] = await Promise.all([adminClient.users(), adminClient.userPermissions()]);
      setUsers(nextUsers);
      setPermissions(nextPermissions);
      setRoleDrafts(Object.fromEntries(nextUsers.map((user) => [user.id, user.role])));
      setMessage("Usuarios sincronizados con la API.");
    } catch {
      setMessage("No se pudieron cargar usuarios. Comprueba sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftUser.email || !draftUser.password) {
      setMessage("Email y password son obligatorios.");
      return;
    }

    setIsCreating(true);
    try {
      const created = await adminClient.createUser({
        email: draftUser.email,
        name: draftUser.name || undefined,
        role: draftUser.role,
        password: draftUser.password
      });
      setUsers((current) => [...current, created]);
      setRoleDrafts((current) => ({ ...current, [created.id]: created.role }));
      setDraftUser({ email: "", name: "", role: "viewer", password: "" });
      setMessage("Usuario creado correctamente.");
    } catch {
      setMessage("No se pudo crear el usuario. Revisa email, password y permisos.");
    } finally {
      setIsCreating(false);
    }
  }

  async function updateRole(user: AdminUser) {
    const nextRole = roleDrafts[user.id] || user.role;
    try {
      const updated = await adminClient.updateUser(user.id, { role: nextRole });
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(`Rol actualizado para ${updated.email}.`);
    } catch {
      setMessage("No se pudo actualizar el rol.");
    }
  }

  async function deleteUser(user: AdminUser) {
    try {
      await adminClient.deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setPendingDeleteUser(null);
      setMessage(`Usuario desactivado: ${user.email}.`);
    } catch {
      setMessage("No se pudo desactivar el usuario.");
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Usuarios y permisos</h1>
            <p className="mt-2 text-sm text-muted-foreground">Gestion admin-only conectado a la API REST.</p>
          </div>
          <Button type="button" variant="outline" onClick={loadUsers} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <form className="grid gap-3 rounded-lg border border-border bg-card p-6 lg:grid-cols-[1fr_1fr_160px_1fr_auto]" onSubmit={createUser}>
        <Input value={draftUser.email} onChange={(event) => setDraftUser((current) => ({ ...current, email: event.target.value }))} placeholder="email@dominio.com" type="email" />
        <Input value={draftUser.name} onChange={(event) => setDraftUser((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre" />
        <select
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
          value={draftUser.role}
          onChange={(event) => setDraftUser((current) => ({ ...current, role: event.target.value as AdminUserRole }))}
        >
          {roles.map((role) => <option key={role}>{role}</option>)}
        </select>
        <Input value={draftUser.password} onChange={(event) => setDraftUser((current) => ({ ...current, password: event.target.value }))} placeholder="Password inicial" type="password" />
        <Button type="submit" disabled={isCreating}>
          <UserPlus data-icon="inline-start" />
          Crear
        </Button>
      </form>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[760px]">
          <div className="border-b border-border p-3">
            <div className="grid max-w-sm grid-cols-[auto_1fr] items-center gap-2 rounded-lg border border-input px-2.5">
              <Search className="size-4 text-muted-foreground" />
              <Input
                aria-label="Buscar usuarios"
                className="border-0 px-0 shadow-none focus-visible:ring-0"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por email, nombre o rol"
              />
            </div>
          </div>
          <div className="grid grid-cols-[1.4fr_120px_120px_180px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Usuario</span>
            <span>Rol</span>
            <span>MFA</span>
            <span>Acciones</span>
          </div>
          {filteredUsers.length ? filteredUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-[1.4fr_120px_120px_180px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <div className="min-w-0">
                <p className="truncate font-medium">{user.email}</p>
                <p className="truncate text-muted-foreground">{user.name || "Sin nombre"}</p>
              </div>
              <select
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                value={roleDrafts[user.id] || user.role}
                onChange={(event) => setRoleDrafts((current) => ({ ...current, [user.id]: event.target.value as AdminUserRole }))}
              >
                {roles.map((role) => <option key={role}>{role}</option>)}
              </select>
              <span>{user.mfaEnabled ? <Badge>activo</Badge> : <Badge variant="outline">pendiente</Badge>}</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => updateRole(user)}>
                  <Save data-icon="inline-start" />
                  Guardar
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => setPendingDeleteUser(user)}>
                  <Trash2 data-icon="inline-start" />
                  Baja
                </Button>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin usuarios para la busqueda actual.</div>
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {roles.map((role) => (
          <div key={role} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{role}</h2>
              <Badge variant={role === "admin" ? "default" : "outline"}>{role}</Badge>
            </div>
            <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
              {(permissions?.[role] || []).map((permission) => <li key={permission}>{permission}</li>)}
            </ul>
          </div>
        ))}
      </section>

      <Dialog open={Boolean(pendingDeleteUser)} onOpenChange={(open) => !open && setPendingDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar baja</DialogTitle>
            <DialogDescription>
              Esta accion desactiva el usuario {pendingDeleteUser?.email}. Podras crear otro acceso si hace falta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteUser(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteUser && deleteUser(pendingDeleteUser)}>
              Confirmar baja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
