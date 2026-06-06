"use client";

import { useEffect, useState } from "react";
import { Download, FileText, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, getApiUrl, type CvAtsReport, type CvAtsRoleReport, type CvGeneratedFileResult, type CvItem, type CvMutation } from "@/lib/api";

const emptyDraft: CvMutation = {
  name: "",
  headline: "",
  summary: "",
  status: "draft"
};

export function CvEditor() {
  const [cv, setCv] = useState<CvItem | null>(null);
  const [draft, setDraft] = useState<CvMutation>(emptyDraft);
  const [message, setMessage] = useState("Cargando CV principal.");
  const [atsMessage, setAtsMessage] = useState("Genera un reporte ATS para la version publica principal.");
  const [atsReport, setAtsReport] = useState<CvAtsReport | null>(null);
  const [atsRoleReport, setAtsRoleReport] = useState<CvAtsRoleReport | null>(null);
  const [atsFile, setAtsFile] = useState<CvGeneratedFileResult | null>(null);
  const [atsTargetRole, setAtsTargetRole] = useState("");
  const [atsJobDescription, setAtsJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAtsLoading, setIsAtsLoading] = useState(false);
  const [isAtsRoleLoading, setIsAtsRoleLoading] = useState(false);
  const [isAtsGenerating, setIsAtsGenerating] = useState<"pdf" | "docx" | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCv();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadCv() {
    setIsLoading(true);
    try {
      const nextCv = await cvClient.primary();
      setCv(nextCv);
      setDraft({
        name: nextCv.name,
        headline: nextCv.headline,
        summary: nextCv.summary,
        status: nextCv.status
      });
      setMessage("CV principal sincronizado con la API.");
    } catch {
      setMessage("No se pudo cargar el CV principal. Comprueba la sesion o el seed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveCv() {
    if (!cv) {
      setMessage("No hay CV cargado para guardar.");
      return;
    }
    if (!draft.name.trim() || !draft.headline.trim() || !draft.summary.trim()) {
      setMessage("Nombre, titular y resumen son obligatorios.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await cvClient.update(cv.id, draft);
      setCv(updated);
      setMessage("CV guardado.");
    } catch {
      setMessage("No se pudo guardar el CV.");
    } finally {
      setIsSaving(false);
    }
  }

  async function loadAtsReport() {
    if (!cv) {
      setAtsMessage("No hay CV cargado para analizar.");
      return;
    }

    setIsAtsLoading(true);
    try {
      const report = await cvClient.atsReport(cv.id);
      setAtsReport(report);
      setAtsMessage("Reporte ATS generado.");
    } catch {
      setAtsMessage("No se pudo generar el reporte ATS.");
    } finally {
      setIsAtsLoading(false);
    }
  }

  async function generateAtsFile(type: "pdf" | "docx") {
    if (!cv) {
      setAtsMessage("No hay CV cargado para exportar.");
      return;
    }

    setIsAtsGenerating(type);
    try {
      const result = type === "pdf" ? await cvClient.generateAtsPdf(cv.id) : await cvClient.generateAtsDocx(cv.id);
      setAtsFile(result);
      setAtsMessage(`${type.toUpperCase()} ATS generado.`);
    } catch {
      setAtsMessage(`No se pudo generar el ${type.toUpperCase()} ATS.`);
    } finally {
      setIsAtsGenerating(null);
    }
  }

  async function loadAtsRoleReport() {
    if (!cv) {
      setAtsMessage("No hay CV cargado para comparar.");
      return;
    }
    if (atsJobDescription.trim().length < 40) {
      setAtsMessage("La descripcion de oferta ATS debe tener al menos 40 caracteres.");
      return;
    }

    setIsAtsRoleLoading(true);
    try {
      const report = await cvClient.atsRoleReport(cv.id, {
        targetRole: atsTargetRole.trim() || undefined,
        jobDescription: atsJobDescription.trim()
      });
      setAtsRoleReport(report);
      setAtsMessage("Reporte ATS contra oferta generado.");
    } catch {
      setAtsMessage("No se pudo comparar el CV contra la oferta.");
    } finally {
      setIsAtsRoleLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">CV Manager</p>
            <h1 className="mt-2 text-3xl font-semibold">Editor de CV</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Edita los campos principales del CV publicado sin tocar codigo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {cv?.isPrimary ? <Badge>principal</Badge> : null}
            <Badge variant="outline">{draft.status}</Badge>
            <Button type="button" variant="outline" onClick={loadCv} disabled={isLoading}>
              <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
              Actualizar
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="cvName">Nombre</Label>
            <Input id="cvName" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cvHeadline">Titular profesional</Label>
            <Input id="cvHeadline" value={draft.headline} onChange={(event) => setDraft((current) => ({ ...current, headline: event.target.value }))} />
          </div>
          <div className="grid gap-2 lg:col-span-2">
            <Label htmlFor="cvSummary">Resumen profesional</Label>
            <Textarea id="cvSummary" rows={6} value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["draft", "published", "archived"] as const).map((status) => (
            <Button key={status} type="button" variant={draft.status === status ? "default" : "outline"} onClick={() => setDraft((current) => ({ ...current, status }))}>
              {status}
            </Button>
          ))}
          <Button type="button" onClick={saveCv} disabled={isSaving}>
            <Save data-icon="inline-start" />
            {isSaving ? "Guardando..." : "Guardar CV"}
          </Button>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">ATS</p>
            <h2 className="mt-2 text-2xl font-semibold">Validacion ATS</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Revisa la compatibilidad textual del CV principal y genera variantes ATS descargables.
            </p>
          </div>
          {atsReport ? (
            <Badge variant={atsReport.status === "strong" ? "default" : "outline"}>
              Score {atsReport.score} - {atsReport.status}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{atsMessage}</p>

        {atsReport ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-md border border-border p-4">
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="mt-2 text-3xl font-semibold">{atsReport.score}</p>
              <p className="text-sm text-muted-foreground">{atsReport.status}</p>
            </div>
            <div className="rounded-md border border-border p-4 lg:col-span-2">
              <p className="text-sm font-medium">Checks</p>
              <div className="mt-3 grid gap-2">
                {atsReport.checks.map((check) => (
                  <div key={check.key} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                    <span>{check.label}</span>
                    <Badge variant={check.passed ? "default" : "outline"}>{check.passed ? "ok" : "revisar"}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-border p-4 lg:col-span-3">
              <p className="text-sm font-medium">Keywords detectadas</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {atsReport.keywords.length > 0 ? atsReport.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline">{keyword}</Badge>
                )) : <span className="text-sm text-muted-foreground">Sin keywords suficientes.</span>}
              </div>
            </div>
            <div className="rounded-md border border-border p-4 lg:col-span-3">
              <p className="text-sm font-medium">Recomendaciones</p>
              {atsReport.recommendations.length > 0 ? (
                <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  {atsReport.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Sin recomendaciones pendientes.</p>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={loadAtsReport} disabled={isAtsLoading || !cv}>
            <ShieldCheck data-icon="inline-start" />
            {isAtsLoading ? "Generando..." : "Generar reporte ATS"}
          </Button>
          <Button type="button" variant="outline" onClick={() => generateAtsFile("pdf")} disabled={Boolean(isAtsGenerating) || !cv}>
            <FileText data-icon="inline-start" />
            {isAtsGenerating === "pdf" ? "Generando PDF..." : "Generar PDF ATS"}
          </Button>
          <Button type="button" variant="outline" onClick={() => generateAtsFile("docx")} disabled={Boolean(isAtsGenerating) || !cv}>
            <FileText data-icon="inline-start" />
            {isAtsGenerating === "docx" ? "Generando DOCX..." : "Generar DOCX ATS"}
          </Button>
          {atsFile?.media.id ? (
            <a className={buttonVariants()} href={getApiUrl(`/media/${atsFile.media.id}/download`)}>
              <Download data-icon="inline-start" />
              Descargar ultimo ATS
            </a>
          ) : null}
        </div>

        <div className="grid gap-4 rounded-md border border-border p-4">
          <div>
            <h3 className="text-lg font-semibold">Comparar contra oferta</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pega una oferta para medir coincidencias sin modificar el CV ni incorporar datos no verificados.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="grid gap-2">
              <Label htmlFor="atsTargetRole">Puesto ATS objetivo</Label>
              <Input id="atsTargetRole" value={atsTargetRole} onChange={(event) => setAtsTargetRole(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="atsJobDescription">Descripcion de oferta ATS</Label>
              <Textarea id="atsJobDescription" rows={4} value={atsJobDescription} onChange={(event) => setAtsJobDescription(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={loadAtsRoleReport} disabled={isAtsRoleLoading || !cv}>
              <ShieldCheck data-icon="inline-start" />
              {isAtsRoleLoading ? "Comparando..." : "Comparar con oferta ATS"}
            </Button>
          </div>

          {atsRoleReport ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-muted-foreground">Match oferta</p>
                <p className="mt-2 text-3xl font-semibold">{atsRoleReport.matchScore}</p>
                <p className="text-sm text-muted-foreground">{atsRoleReport.targetRole || "Puesto sin especificar"}</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-sm font-medium">Keywords encontradas</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {atsRoleReport.matchedKeywords.length > 0 ? atsRoleReport.matchedKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">{keyword}</Badge>
                  )) : <span className="text-sm text-muted-foreground">Sin coincidencias.</span>}
                </div>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-sm font-medium">Keywords pendientes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {atsRoleReport.missingKeywords.length > 0 ? atsRoleReport.missingKeywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">{keyword}</Badge>
                  )) : <span className="text-sm text-muted-foreground">Sin pendientes.</span>}
                </div>
              </div>
              <div className="rounded-md border border-border p-4 lg:col-span-3">
                <p className="text-sm font-medium">Revision sugerida</p>
                <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  {atsRoleReport.roleRecommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
