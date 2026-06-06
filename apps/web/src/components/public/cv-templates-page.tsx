import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCvPath, getCvTemplatePath, getPortfolioPath, type Locale } from "@/lib/i18n";
import { getCvTemplateFeatures, type CvTemplateItem } from "@/lib/cv-templates";
import { cn } from "@/lib/utils";

const copyByLocale = {
  es: {
    eyebrow: "CV Manager",
    title: "Plantillas de CV",
    intro:
      "Formatos publicos preparados para revisar el CV con diferentes enfoques: ejecutivo, tecnico, ATS o compacto.",
    back: "Volver al portfolio",
    cv: "Ver CV online",
    download: "Descargar CV",
    preview: "Ver preview",
    available: "Gestionable desde el panel admin",
    updated: "Actualizada"
  },
  en: {
    eyebrow: "Resume Manager",
    title: "Resume templates",
    intro: "Public formats ready to review the resume from executive, technical, ATS or compact angles.",
    back: "Back to portfolio",
    cv: "View resume online",
    download: "Download resume",
    preview: "View preview",
    available: "Managed from the admin panel",
    updated: "Updated"
  }
} as const;

export function CvTemplatesPage({
  templates,
  locale,
  cvUrl
}: {
  templates: CvTemplateItem[];
  locale: Locale;
  cvUrl: string;
}) {
  const copy = copyByLocale[locale];

  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-sm text-primary">{copy.eyebrow}</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-normal sm:text-6xl">{copy.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.intro}</p>
          </div>
          <nav className="flex flex-wrap gap-3" aria-label={copy.title}>
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href={getPortfolioPath(locale)}>
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
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={copy.title}>
          {templates.map((template, index) => (
            <article
              key={template.slug}
              className="group flex min-h-64 flex-col justify-between rounded-lg border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/60"
              style={{ "--template-color": template.config.primaryColor || "#0f766e" } as CSSProperties}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--template-color)]/15 text-[var(--template-color)]">
                    <LayoutTemplate className="size-5" aria-hidden="true" />
                  </span>
                </div>
                <h2 className="mt-6 text-2xl font-semibold">{template.name}</h2>
                <p className="mt-3 min-h-16 leading-7 text-muted-foreground">{template.description}</p>
              </div>
              <div className="mt-8 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {getCvTemplateFeatures(template, locale).map((feature) => (
                    <Badge key={feature} variant={template.slug === "ats-friendly" ? "default" : "outline"}>
                      {feature}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                  <span>{copy.available}</span>
                  <Link className="font-medium text-primary" href={getCvTemplatePath(locale, template.slug)}>
                    {copy.preview}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
