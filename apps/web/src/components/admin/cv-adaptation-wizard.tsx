"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, type CvAdaptationResult, type CvVersionItem } from "@/lib/api";

export function CvAdaptationWizard() {
  const [versions, setVersions] = useState<CvVersionItem[]>([]);
  const [baseCvVersionId, setBaseCvVersionId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<CvAdaptationResult | null>(null);
  const [message, setMessage] = useState("Cargando versiones base.");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdapting, setIsAdapting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVersions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function loadVersions() {
    setIsLoading(true);
    try {
      const nextVersions = await cvClient.versions();
      setVersions(nextVersions);
      setBaseCvVersionId((current) => current || nextVersions[0]?.id || "");
      setMessage(nextVersions.length ? "Selecciona una version base." : "No hay versiones base disponibles.");
    } catch {
      setMessage("No se pudieron cargar versiones. Comprueba la sesion admin.");
    } finally {
      setIsLoading(false);
    }
  }

  async function adaptCv() {
    if (!baseCvVersionId || !targetRole.trim() || jobDescription.trim().length < 40) {
      setMessage("Selecciona version base, puesto objetivo y una oferta de al menos 40 caracteres.");
      return;
    }

    setIsAdapting(true);
    try {
      const nextResult = await cvClient.adapt({
        baseCvVersionId,
        targetRole: targetRole.trim(),
        targetCompany: targetCompany.trim() || undefined,
        jobDescription: jobDescription.trim()
      });
      setResult(nextResult);
      setMessage("Propuesta generada. Revisa antes de aprobar o convertirla en version.");
    } catch {
      setMessage("No se pudo generar la adaptacion.");
    } finally {
      setIsAdapting(false);
    }
  }

  const selectedVersion = versions.find((version) => version.id === baseCvVersionId);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-primary">CV Manager</p>
            <h1 className="mt-2 text-3xl font-semibold">Adaptar CV</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Genera una propuesta basada en una version existente sin inventar experiencia ni certificaciones.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadVersions} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} data-icon="inline-start" />
            Versiones
          </Button>
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>

        <div className="grid gap-2">
          <Label>Version base</Label>
          <div className="flex flex-wrap gap-2">
            {versions.length ? versions.map((version) => (
              <Button
                key={version.id}
                type="button"
                variant={baseCvVersionId === version.id ? "default" : "outline"}
                onClick={() => setBaseCvVersionId(version.id)}
              >
                {version.name}
              </Button>
            )) : (
              <p className="text-sm text-muted-foreground">Sin versiones base.</p>
            )}
          </div>
          {selectedVersion ? <p className="text-sm text-muted-foreground">Base seleccionada: {selectedVersion.targetRole}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="targetRole">Puesto objetivo</Label>
          <Input id="targetRole" value={targetRole} onChange={(event) => setTargetRole(event.target.value)} placeholder="Delivery Manager" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="targetCompany">Empresa objetivo opcional</Label>
          <Input id="targetCompany" value={targetCompany} onChange={(event) => setTargetCompany(event.target.value)} placeholder="Empresa" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="jobDescription">Descripcion de oferta</Label>
          <Textarea id="jobDescription" rows={12} value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Pega aqui la oferta laboral." />
        </div>
        <Button type="button" onClick={adaptCv} disabled={isAdapting}>
          <WandSparkles data-icon="inline-start" />
          {isAdapting ? "Generando..." : "Proponer adaptacion"}
        </Button>
      </section>

      <aside className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">Sugerencias pendientes</h2>
        {result ? (
          <div className="mt-4 grid gap-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <Badge>{result.proposed.adaptationMeta?.mode || "rules"}</Badge>
              {result.proposed.adaptationMeta?.pendingReview ? <Badge variant="outline">revision humana</Badge> : null}
            </div>
            <div>
              <p className="font-medium text-foreground">Keywords</p>
              <p className="mt-1">{result.proposed.adaptationMeta?.keywords?.join(", ") || "Sin keywords detectadas."}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Resumen propuesto</p>
              <p className="mt-1">{result.proposed.summary || "Sin resumen propuesto."}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Skills priorizadas</p>
              <p className="mt-1">{result.proposed.skills?.slice(0, 8).map((skill) => skill.name).join(", ") || "Sin skills."}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Experiencias priorizadas</p>
              <p className="mt-1">{result.proposed.experiences?.slice(0, 5).map((experience) => `${experience.role} - ${experience.company}`).join(", ") || "Sin experiencias."}</p>
            </div>
            <p>{result.proposed.adaptationMeta?.guardrail}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">La propuesta aparecera aqui antes de crear una nueva version.</p>
        )}
      </aside>
    </div>
  );
}
