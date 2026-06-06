"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cvClient, type CvAdaptationResult, type CvVersionItem } from "@/lib/api";

type AdaptationBlockKey = "summary" | "skills" | "experiences";

const adaptationBlocks: Array<{ key: AdaptationBlockKey; label: string }> = [
  { key: "summary", label: "resumen" },
  { key: "skills", label: "skills" },
  { key: "experiences", label: "experiencias" }
];

const defaultAcceptedBlocks: Record<AdaptationBlockKey, boolean> = {
  summary: true,
  skills: true,
  experiences: true
};

export function CvAdaptationWizard() {
  const [versions, setVersions] = useState<CvVersionItem[]>([]);
  const [baseCvVersionId, setBaseCvVersionId] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<CvAdaptationResult | null>(null);
  const [acceptedBlocks, setAcceptedBlocks] = useState(defaultAcceptedBlocks);
  const [acceptedSkillNames, setAcceptedSkillNames] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("Cargando versiones base.");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

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
      setAcceptedBlocks(defaultAcceptedBlocks);
      setAcceptedSkillNames(skillReviewState(nextResult.proposed.skills || []));
      setMessage("Propuesta generada. Revisa antes de aprobar o convertirla en version.");
    } catch {
      setMessage("No se pudo generar la adaptacion.");
    } finally {
      setIsAdapting(false);
    }
  }

  const selectedVersion = versions.find((version) => version.id === baseCvVersionId);

  function setBlockAccepted(key: AdaptationBlockKey, checked: boolean) {
    setAcceptedBlocks((current) => ({ ...current, [key]: checked }));
  }

  function setSkillAccepted(name: string, checked: boolean) {
    setAcceptedSkillNames((current) => ({ ...current, [name]: checked }));
  }

  function buildReviewedProposal(nextResult: CvAdaptationResult) {
    const nextProposal = { ...(nextResult.proposed as Record<string, unknown>) };
    const accepted = adaptationBlocks
      .map((block) => block.key)
      .filter((key) => acceptedBlocks[key] && key in nextProposal);
    const rejected = adaptationBlocks
      .map((block) => block.key)
      .filter((key) => !acceptedBlocks[key] && key in nextProposal);

    for (const key of rejected) {
      delete nextProposal[key];
    }

    const nextMeta: Record<string, unknown> = {
      ...(nextResult.proposed.adaptationMeta || {}),
      acceptedBlocks: accepted,
      rejectedBlocks: rejected
    };

    if (acceptedBlocks.skills && Array.isArray(nextResult.proposed.skills)) {
      const acceptedSkills = nextResult.proposed.skills
        .map((skill) => skill.name || "")
        .filter((name) => name && acceptedSkillNames[name] !== false);
      const rejectedSkills = nextResult.proposed.skills
        .map((skill) => skill.name || "")
        .filter((name) => name && acceptedSkillNames[name] === false);
      const filteredSkills = nextResult.proposed.skills.filter((skill) => {
        const name = skill.name || "";
        return !name || acceptedSkillNames[name] !== false;
      });
      if (filteredSkills.length) {
        nextProposal.skills = filteredSkills;
      } else {
        delete nextProposal.skills;
      }
      nextMeta.acceptedSkills = acceptedSkills;
      nextMeta.rejectedSkills = rejectedSkills;
    }

    nextProposal.adaptationMeta = nextMeta;

    return nextProposal;
  }

  async function createAdaptedVersion() {
    if (!result || !selectedVersion) {
      setMessage("Genera una propuesta y selecciona una version base antes de crear el borrador.");
      return;
    }

    setIsCreatingVersion(true);
    try {
      const role = result.request.targetRole || targetRole.trim();
      const reviewedProposal = buildReviewedProposal(result);
      const created = await cvClient.createVersion({
        cvId: selectedVersion.cvId,
        name: `CV adaptado - ${role}`,
        slug: buildVersionSlug(`${role}-${Date.now().toString(36)}`),
        description: result.request.targetCompany
          ? `Adaptado para ${result.request.targetCompany}`
          : "Adaptado desde propuesta pendiente de revision.",
        targetRole: role,
        targetCompany: result.request.targetCompany || null,
        language: selectedVersion.language || "es",
        status: "draft",
        templateId: selectedVersion.templateId || null,
        structuredJson: {
          ...reviewedProposal,
          adaptationMeta: {
            ...((reviewedProposal.adaptationMeta || {}) as Record<string, unknown>),
            createdFromRequestId: result.request.id,
            pendingReview: true
          }
        }
      });
      setBaseCvVersionId(created.id);
      await loadVersions();
      setMessage(`Version borrador creada: ${created.name}. Revisala en Versiones de CV antes de publicar.`);
    } catch {
      setMessage("No se pudo crear la version adaptada.");
    } finally {
      setIsCreatingVersion(false);
    }
  }

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
            <fieldset className="grid gap-2 rounded-lg border border-border p-3">
              <legend className="px-1 font-medium text-foreground">Revision por bloques</legend>
              {adaptationBlocks.map((block) => {
                const hasProposal = block.key in result.proposed;
                return (
                  <div key={block.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`accept-${block.key}`}
                      checked={acceptedBlocks[block.key]}
                      disabled={!hasProposal}
                      onCheckedChange={(checked) => setBlockAccepted(block.key, Boolean(checked))}
                    />
                    <Label htmlFor={`accept-${block.key}`}>Aceptar {block.label}</Label>
                    {!hasProposal ? <span className="text-xs text-muted-foreground">sin propuesta</span> : null}
                  </div>
                );
              })}
            </fieldset>
            <div>
              <p className="font-medium text-foreground">Resumen propuesto</p>
              <p className="mt-1">{result.proposed.summary || "Sin resumen propuesto."}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Skills priorizadas</p>
              {result.proposed.skills?.length ? (
                <div className="mt-2 grid gap-2">
                  {result.proposed.skills.slice(0, 8).map((skill, index) => {
                    const name = skill.name || `Skill ${index + 1}`;
                    const id = `accept-skill-${buildVersionSlug(name) || index}`;
                    return (
                      <div key={`${name}-${index}`} className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={acceptedSkillNames[name] !== false}
                          disabled={!acceptedBlocks.skills}
                          onCheckedChange={(checked) => setSkillAccepted(name, Boolean(checked))}
                        />
                        <Label htmlFor={id}>Aceptar skill {name}</Label>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-1">Sin skills.</p>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">Experiencias priorizadas</p>
              <p className="mt-1">{result.proposed.experiences?.slice(0, 5).map((experience) => `${experience.role} - ${experience.company}`).join(", ") || "Sin experiencias."}</p>
            </div>
            <p>{result.proposed.adaptationMeta?.guardrail}</p>
            <Button type="button" onClick={createAdaptedVersion} disabled={isCreatingVersion}>
              {isCreatingVersion ? "Creando version..." : "Crear version borrador"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">La propuesta aparecera aqui antes de crear una nueva version.</p>
        )}
      </aside>
    </div>
  );
}

function buildVersionSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function skillReviewState(skills: Array<{ name?: string }>) {
  return Object.fromEntries(
    skills
      .map((skill) => skill.name || "")
      .filter(Boolean)
      .map((name) => [name, true])
  );
}
