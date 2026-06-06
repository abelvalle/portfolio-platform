import Link from "next/link";
import { ArrowLeft, Download, Eye, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CvA4Preview } from "@/components/cv/cv-a4-preview";
import {
  getCvPath,
  getCvTemplatePath,
  getCvTemplatesPath,
  type Locale
} from "@/lib/i18n";
import { getCvTemplateFeatures, type CvTemplateItem } from "@/lib/cv-templates";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";
import { buildPublicThemeStyle } from "@/lib/public-theme";
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
  const sharePath = getCvTemplatePath(locale, template.slug);

  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground sm:px-10 lg:px-16" style={buildPublicThemeStyle(snapshot.theme)}>
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
          <CvA4Preview snapshot={snapshot} template={template} locale={locale} />
        </section>
      </div>
    </main>
  );
}
