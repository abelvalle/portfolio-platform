"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiUrl, mediaClient, type MediaAsset, type MediaStorageStatus } from "@/lib/api";

export function FileUploader() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [storageStatus, setStorageStatus] = useState<MediaStorageStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [type, setType] = useState("cv-manual");
  const [message, setMessage] = useState("Listo para subir archivos.");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDeleteAsset, setPendingDeleteAsset] = useState<MediaAsset | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void loadMedia();
  }, []);

  async function loadMedia() {
    setIsLoading(true);
    try {
      const [status, items] = await Promise.all([mediaClient.storageStatus(), mediaClient.list()]);
      setStorageStatus(status);
      setAssets(items);
      setMessage("Media sincronizada con la API.");
    } catch {
      setMessage("No se pudo leer media. Revisa sesion API o variables de entorno.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Selecciona un archivo antes de guardar.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (altText.trim()) {
      formData.append("altText", altText.trim());
    }
    if (type.trim()) {
      formData.append("type", type.trim());
    }

    try {
      const uploaded = await mediaClient.upload(formData);
      setAssets((current) => [uploaded, ...current.filter((asset) => asset.id !== uploaded.id)]);
      setFile(null);
      setAltText("");
      setMessage("Archivo guardado correctamente.");
    } catch {
      setMessage("No se pudo subir el archivo. Comprueba sesion, tipo y tamano permitido.");
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteAsset(asset: MediaAsset) {
    setBusyId(asset.id);
    try {
      await mediaClient.delete(asset.id);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setPendingDeleteAsset(null);
      setMessage(`Asset eliminado: ${asset.originalName || asset.filename}.`);
    } catch {
      setMessage("No se pudo eliminar el asset.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form className="rounded-lg border border-dashed border-border bg-card p-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Upload />
          <div>
            <h2 className="text-xl font-semibold">Subir media</h2>
            <p className="mt-2 text-sm text-muted-foreground">PDF, DOCX o imagen de vista previa opcional.</p>
          </div>
          <label className="grid gap-2 text-sm">
            Archivo
            <Input
              type="file"
              accept=".pdf,.docx,image/jpeg,image/png,image/webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label className="grid gap-2 text-sm">
            Texto alternativo
            <Input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Retrato, CV PDF..." />
          </label>
          <label className="grid gap-2 text-sm">
            Tipo
            <Input value={type} onChange={(event) => setType(event.target.value)} placeholder="cv-manual, avatar, og-image" />
          </label>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? <RefreshCw className="animate-spin" data-icon="inline-start" /> : <Upload data-icon="inline-start" />}
            {isUploading ? "Subiendo..." : "Guardar archivo"}
          </Button>
          <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
        </div>
      </form>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Biblioteca media</h2>
              <p className="mt-2 text-sm text-muted-foreground">Assets registrados y listos para enlazar desde CV o portfolio.</p>
            </div>
            <Button type="button" variant="outline" onClick={loadMedia} disabled={isLoading}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
              Actualizar
            </Button>
          </div>

          {storageStatus ? (
            <div className="flex flex-wrap gap-2">
              <Badge>storage: {storageStatus.provider}</Badge>
              <Badge variant="outline">max {storageStatus.maxFileSizeMb} MB</Badge>
              <Badge variant="outline">{storageStatus.storageDir}</Badge>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-border">
            {assets.length ? (
              <ul className="divide-y divide-border">
                {assets.slice(0, 8).map((asset) => (
                  <li key={asset.id} className="grid gap-2 p-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p className="font-medium">{asset.originalName || asset.filename}</p>
                      <p className="text-sm text-muted-foreground">{asset.mimeType} - {formatSize(asset.size)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <a className="inline-flex items-center gap-2 text-sm text-primary" href={getApiUrl(`/media/${asset.id}/download`)}>
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                        Descargar
                      </a>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        aria-label={`Eliminar ${asset.originalName || asset.filename}`}
                        onClick={() => setPendingDeleteAsset(asset)}
                        disabled={busyId === asset.id}
                      >
                        <Trash2 data-icon="inline-start" />
                        Eliminar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">Sin assets registrados.</div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={Boolean(pendingDeleteAsset)} onOpenChange={(open) => !open && setPendingDeleteAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar borrado</DialogTitle>
            <DialogDescription>
              Esta accion dara de baja el asset {pendingDeleteAsset?.originalName || pendingDeleteAsset?.filename}. El registro queda oculto de la biblioteca.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDeleteAsset(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => pendingDeleteAsset && deleteAsset(pendingDeleteAsset)}>
              Eliminar asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function formatSize(size?: number | null) {
  if (!size) {
    return "tamano pendiente";
  }
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
