"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, RefreshCw, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminClient, type CertificationItem, type CertificationMutation } from "@/lib/api";

const emptyDraft = {
  title: "",
  institution: "",
  date: "",
  description: "",
  certificateUrl: "",
  attachmentId: "",
  visible: true
};

export function CertificationManagement() {
  const [items, setItems] = useState<CertificationItem[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState("Cargando certificaciones.");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCertifications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadCertifications() {
    setIsLoading(true);
    try {
      const nextItems = await adminClient.certifications();
      setItems(nextItems);
      setMessage(nextItems.length ? "Certificaciones sincronizadas con la API." : "Sin certificaciones registradas.");
    } catch {
      setMessage("No se pudieron cargar certificaciones. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  function buildMutation(order = items.length): CertificationMutation {
    return {
      title: draft.title.trim(),
      institution: draft.institution.trim(),
      date: draft.date.trim(),
      description: draft.description.trim() || null,
      certificateUrl: draft.certificateUrl.trim() || null,
      attachmentId: draft.attachmentId.trim() || null,
      order,
      visible: draft.visible
    };
  }

  async function createCertification() {
    const payload = buildMutation(items.length);
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

  async function patchCertification(id: string, data: Partial<CertificationMutation>) {
    setBusyId(id);
    try {
      await adminClient.updateCertification(id, data);
      setMessage("Certificacion actualizada.");
      await loadCertifications();
    } catch {
      setMessage("No se pudo actualizar la certificacion.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteCertification(id: string) {
    setBusyId(id);
    try {
      await adminClient.deleteCertification(id);
      setMessage("Certificacion eliminada.");
      await loadCertifications();
    } catch {
      setMessage("No se pudo eliminar la certificacion.");
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
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[1.2fr_1fr_100px_120px_180px] border-b border-border bg-muted/40 p-3 text-sm font-medium">
            <span>Titulo</span>
            <span>Institucion</span>
            <span>Fecha</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {items.length ? items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1.2fr_1fr_100px_120px_180px] gap-3 border-b border-border p-3 text-sm last:border-b-0">
              <span className="font-medium">{item.title}</span>
              <span className="text-muted-foreground">{item.institution}</span>
              <span className="text-muted-foreground">{item.date}</span>
              <span><Badge variant={item.visible ? "default" : "secondary"}>{item.visible ? "visible" : "oculta"}</Badge></span>
              <span className="flex gap-1">
                <Button type="button" variant="outline" size="icon" onClick={() => patchCertification(item.id, { visible: !item.visible })} disabled={busyId === item.id}>
                  {item.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchCertification(item.id, { order: item.order - 1 })} disabled={busyId === item.id}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => patchCertification(item.id, { order: item.order + 1 })} disabled={busyId === item.id}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => deleteCertification(item.id)} disabled={busyId === item.id}>
                  <Trash2 />
                </Button>
              </span>
            </div>
          )) : (
            <div className="p-8 text-center text-sm text-muted-foreground">Sin certificaciones registradas.</div>
          )}
        </div>
      </section>
    </div>
  );
}
