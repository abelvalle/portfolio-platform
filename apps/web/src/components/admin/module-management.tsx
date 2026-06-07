"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Power, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminClient, type AppModuleItem } from "@/lib/api";

export function ModuleManagement() {
  const [modules, setModules] = useState<AppModuleItem[]>([]);
  const [message, setMessage] = useState("Cargando modulos.");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadModules = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextModules = await adminClient.appModules();
      setModules(nextModules);
      setMessage(nextModules.length ? "Modulos sincronizados con la API." : "Sin modulos registrados.");
    } catch {
      setMessage("No se pudieron cargar modulos. Comprueba sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadModules();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadModules]);

  async function patchModule(id: string, data: Partial<AppModuleItem>, successMessage: string) {
    setBusyId(id);
    try {
      await adminClient.updateAppModule(id, data);
      await loadModules();
      setMessage(successMessage);
      window.dispatchEvent(new Event("app-modules:updated"));
    } catch {
      setMessage("No se pudo actualizar el modulo.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">Configuracion</p>
            <h1 className="mt-2 text-3xl font-semibold">Modulos de la plataforma</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Control operativo de modulos habilitados para preparar el panel a futuras extensiones.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadModules} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Actualizar
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </section>

      <section className="overflow-x-auto rounded-lg border border-border">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1fr_160px_120px_220px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Modulo</span>
            <span>Clave</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {modules.length ? modules.map((module) => (
            <div key={module.id} className="grid grid-cols-[1fr_160px_120px_220px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span>
                <span className="block font-medium">{module.name}</span>
                <span className="block text-muted-foreground">{module.description || "Sin descripcion."}</span>
              </span>
              <span className="text-muted-foreground">{module.key}</span>
              <span>
                <Badge variant={module.enabled ? "default" : "secondary"}>{module.enabled ? "activo" : "inactivo"}</Badge>
              </span>
              <span className="flex flex-wrap gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => patchModule(module.id, { enabled: !module.enabled }, "Estado del modulo actualizado.")} disabled={busyId === module.id}>
                  <Power data-icon="inline-start" />
                  {module.enabled ? "Desactivar" : "Activar"}
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label="Subir modulo" onClick={() => patchModule(module.id, { order: module.order - 1 }, "Orden actualizado.")} disabled={busyId === module.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" aria-label="Bajar modulo" onClick={() => patchModule(module.id, { order: module.order + 1 }, "Orden actualizado.")} disabled={busyId === module.id}>
                  <ArrowDown />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin modulos registrados.</div>
          )}
        </div>
      </section>
    </div>
  );
}
