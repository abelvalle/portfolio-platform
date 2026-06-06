import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getCvPath,
  getCvTemplatePath,
  getCvTemplatesPath,
  type Locale
} from "@/lib/i18n";
import { getCvTemplateFeatures, type CvTemplateItem } from "@/lib/cv-templates";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";
import { cn } from "@/lib/utils";

const copyByLocale = {
  es: {
    eyebrow: "Preview de plantilla",
    preview: "Preview A4",
    back: "Todas las plantillas",
    cv: "Ver CV online",
    download: "Descargar CV",
    share: "URL publica",
    summary: "Resumen",
    experience: "Experiencia",
    skills: "Skills",
    education: "Formacion",
    contact: "Contacto",
    current: "Actual"
  },
  en: {
    eyebrow: "Template preview",
    preview: "A4 preview",
    back: "All templates",
    cv: "View resume online",
    download: "Download resume",
    share: "Public URL",
    summary: "Summary",
    experience: "Experience",
    skills: "Skills",
    education: "Education",
    contact: "Contact",
    current: "Present"
  }
} as const;

export function CvTemplatePreviewPage({
  template,
  snapshot,
  locale,
  cvUrl
}: {
  template: CvTemplateItem;
  snapshot: PortfolioSnapshot;
  locale: Locale;
  cvUrl: string;
}) {
  const copy = copyByLocale[locale];
  const color = template.config.primaryColor || "#0f766e";
  const isCompact = template.config.density === "compact";
  const showPhoto = template.config.includePhoto !== false;
  const sharePath = getCvTemplatePath(locale, template.slug);
  const visibleExperiences = snapshot.experiences.slice(0, isCompact ? 2 : 3);
  const visibleSkills = snapshot.skills.slice(0, isCompact ? 10 : 14);
  const visibleEducation = [...snapshot.education, ...snapshot.certifications].slice(0, isCompact ? 2 : 4);

  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[360px_1fr]">
        <aside className="flex flex-col gap-6">
          <div>
            <p className="font-mono text-sm text-primary">{copy.eyebrow}</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-normal">{template.name}</h1>
            <p className="mt-4 leading-7 text-muted-foreground">{template.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {getCvTemplateFeatures(template, locale).map((feature) => (
              <Badge key={feature} variant={template.slug === "ats-friendly" ? "default" : "outline"}>
                {feature}
              </Badge>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Share2 className="size-4" aria-hidden="true" />
              {copy.share}
            </div>
            <p className="mt-2 break-all font-mono text-sm text-muted-foreground">{sharePath}</p>
          </div>

          <nav className="flex flex-col gap-3" aria-label={template.name}>
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href={getCvTemplatesPath(locale)}>
              <ArrowLeft data-icon="inline-start" />
              {copy.back}
            </Link>
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href={getCvPath(locale)}>
              <Eye data-icon="inline-start" />
              {copy.cv}
            </Link>
            <a className={cn(buttonVariants({ size: "lg" }))} href={cvUrl} download>
              <Download data-icon="inline-start" />
              {copy.download}
            </a>
          </nav>
        </aside>

        <section className="min-w-0" aria-label={copy.preview}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="font-mono text-sm text-muted-foreground">{copy.preview}</p>
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">A4</span>
          </div>
          <article
            className="mx-auto aspect-[210/297] w-full max-w-[860px] overflow-hidden bg-white p-8 text-slate-950 shadow-2xl sm:p-10"
            style={
              {
                "--cv-template-color": color,
                fontFamily: template.config.fontFamily || "Inter"
              } as CSSProperties
            }
          >
            <header className="grid gap-5 border-b border-slate-200 pb-5 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-[var(--cv-template-color)]">
                  {snapshot.profile.headline}
                </p>
                <h2 className="mt-2 text-3xl font-bold leading-tight">{snapshot.profile.fullName}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{snapshot.profile.subtitle}</p>
              </div>
              {showPhoto ? (
                <div className="relative size-24 overflow-hidden rounded-lg border border-slate-200">
                  <Image
                    src="/media/abel-portrait-dark.png"
                    alt={snapshot.profile.fullName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ) : null}
            </header>

            <div className={cn("grid gap-6 pt-6", isCompact ? "text-[11px] leading-5" : "text-xs leading-6")}>
              <PreviewSection title={copy.contact} color={color}>
                <p>{snapshot.profile.email}</p>
                <p>{snapshot.profile.phone}</p>
                <p>{snapshot.profile.location}</p>
              </PreviewSection>

              <PreviewSection title={copy.summary} color={color}>
                <p>{snapshot.cv.summary}</p>
              </PreviewSection>

              <PreviewSection title={copy.experience} color={color}>
                <div className="grid gap-3">
                  {visibleExperiences.map((experience) => (
                    <div key={`${experience.company}-${experience.role}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold">{experience.role}</p>
                        <p className="text-[10px] uppercase text-slate-500">
                          {experience.endDate ? `${experience.startDate} - ${experience.endDate}` : `${experience.startDate} - ${copy.current}`}
                        </p>
                      </div>
                      <p className="text-slate-600">{experience.company}</p>
                      <p className="mt-1 text-slate-700">{experience.description}</p>
                    </div>
                  ))}
                </div>
              </PreviewSection>

              <PreviewSection title={copy.skills} color={color}>
                <div className="flex flex-wrap gap-1.5">
                  {visibleSkills.map((skill) => (
                    <span key={`${skill.category}-${skill.name}`} className="rounded border border-slate-200 px-2 py-1 text-[10px]">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </PreviewSection>

              <PreviewSection title={copy.education} color={color}>
                <div className="grid gap-2">
                  {visibleEducation.map((item) => (
                    <p key={`${item.title}-${item.institution}`}>
                      <span className="font-semibold">{item.title}</span> - {item.institution} - {item.date}
                    </p>
                  ))}
                </div>
              </PreviewSection>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function PreviewSection({
  title,
  color,
  children
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2">
      <h3 className="border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-normal" style={{ color }}>
        {title}
      </h3>
      <div className="text-slate-700">{children}</div>
    </section>
  );
}
