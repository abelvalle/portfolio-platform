import { Fragment, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { CvTemplateItem } from "@/lib/cv-templates";
import type { Locale } from "@/lib/i18n";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";

type PreviewFormationItem = PortfolioSnapshot["education"][number] & {
  url?: string | null;
  certificateUrl?: string | null;
  credentialId?: string | null;
};

type PreviewSkillItem = PortfolioSnapshot["skills"][number] & {
  categoryName?: string | null;
};

type PreviewBlock = {
  key: string;
  node: ReactNode;
  weight: number;
};

const previewCopy = {
  es: {
    summary: "Resumen",
    experience: "Experiencia",
    skills: "Skills",
    education: "Formacion",
    languages: "Idiomas",
    projects: "Proyectos",
    contact: "Contacto",
    current: "Actual"
  },
  en: {
    summary: "Summary",
    experience: "Experience",
    skills: "Skills",
    education: "Education",
    languages: "Languages",
    projects: "Projects",
    contact: "Contact",
    current: "Present"
  }
} as const;

export function CvA4Preview({
  snapshot,
  template,
  locale,
  className
}: {
  snapshot: PortfolioSnapshot;
  template?: CvTemplateItem;
  locale: Locale;
  className?: string;
}) {
  const copy = previewCopy[locale];
  const color = template?.config.primaryColor || "#0f766e";
  const isCompact = template?.config.density === "compact";
  const density = isCompact ? "compact" : "normal";
  const showPhoto = template?.config.includePhoto !== false;
  const visibleExperiences = snapshot.experiences.slice(0, isCompact ? 2 : 3);
  const languageSkills = snapshot.skills.filter(isLanguageSkill);
  const visibleSkills = snapshot.skills.filter((skill) => !isLanguageSkill(skill)).slice(0, isCompact ? 10 : 14);
  const visibleLanguages = languageSkills.slice(0, 3);
  const visibleEducation = [...snapshot.education, ...snapshot.certifications].slice(0, isCompact ? 2 : 4);
  const visibleProjects = snapshot.projects
    .filter((project) => project.status === "published" || project.featured)
    .slice(0, 1);
  const contactItems = [snapshot.profile.email, snapshot.profile.phone, snapshot.profile.location].filter((item): item is string => Boolean(item));
  const blockCandidates: Array<PreviewBlock | null> = [
    {
      key: "contact",
      weight: 1,
      node: (
        <PreviewSection title={copy.contact} color={color} section="contact">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {contactItems.map((item) => (
              <span key={item} data-cv-contact-item="true">{item}</span>
            ))}
          </div>
        </PreviewSection>
      )
    },
    {
      key: "summary",
      weight: 2,
      node: (
        <PreviewSection title={copy.summary} color={color} section="summary">
          <p>{snapshot.cv.summary}</p>
        </PreviewSection>
      )
    },
    {
      key: "experiences",
      weight: Math.max(3, visibleExperiences.length * 3),
      node: (
        <PreviewSection title={copy.experience} color={color} section="experiences">
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
      )
    },
    {
      key: "skills",
      weight: 2,
      node: (
        <PreviewSection title={copy.skills} color={color} section="skills">
          <div className="flex flex-wrap gap-1.5">
            {visibleSkills.map((skill) => (
              <span key={`${skillCategory(skill)}-${skill.name}`} className="rounded border border-slate-200 px-2 py-1 text-[10px]">
                {skill.name}
              </span>
            ))}
          </div>
        </PreviewSection>
      )
    },
    visibleLanguages.length > 0
      ? {
          key: "languages",
          weight: 1,
          node: (
            <PreviewSection title={copy.languages} color={color} section="languages">
              <div className="flex flex-wrap gap-1.5">
                {visibleLanguages.map((language) => (
                  <span key={language.name} className="rounded border border-slate-200 px-2 py-1 text-[10px]">
                    {language.name}
                  </span>
                ))}
              </div>
            </PreviewSection>
          )
        }
      : null,
    {
      key: "formation",
      weight: Math.max(2, visibleEducation.length * 1.4),
      node: (
        <PreviewSection title={copy.education} color={color} section="formation">
          <div className="grid gap-2">
            {visibleEducation.map((item) => (
              <div key={`${item.title}-${item.institution}`}>
                <p>
                  <span className="font-semibold">{item.title}</span> - {item.institution} - {item.date}
                </p>
                <FormationMetadata item={item as PreviewFormationItem} />
              </div>
            ))}
          </div>
        </PreviewSection>
      )
    },
    visibleProjects.length > 0
      ? {
          key: "projects",
          weight: 2,
          node: (
            <PreviewSection title={copy.projects} color={color} section="projects">
              <div className="grid gap-2">
                {visibleProjects.map((project) => (
                  <div key={project.name}>
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-slate-700">{project.description}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {project.technologies.slice(0, 4).map((technology) => (
                        <span key={`${project.name}-${technology}`} className="rounded border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-500">
                          {technology}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PreviewSection>
          )
        }
      : null
  ];
  const blocks = blockCandidates.filter((block): block is PreviewBlock => Boolean(block));
  const pages = paginatePreviewBlocks(blocks, isCompact);

  return (
    <div className={cn("mx-auto grid w-full max-w-[860px] gap-6 overflow-x-auto pb-2", className)} data-cv-preview-pages="true" data-cv-page-count={pages.length}>
      {pages.map((pageBlocks, pageIndex) => (
        <article
          key={`page-${pageIndex + 1}`}
          className="cv-page aspect-[210/297] w-full min-w-[620px] overflow-hidden bg-white p-8 text-slate-950 shadow-2xl sm:p-10"
          data-cv-preview="a4"
          data-cv-renderer="web-preview"
          data-cv-density={density}
          data-cv-template={template?.slug || "default"}
          data-page-index={pageIndex + 1}
          data-page-count={pages.length}
          data-page-size="A4"
          style={
            {
              "--cv-template-color": color,
              fontFamily: template?.config.fontFamily || "Inter"
            } as CSSProperties
          }
        >
          {pageIndex === 0 ? (
            <header className="cv-header grid gap-5 border-b border-slate-200 pb-5 sm:grid-cols-[1fr_auto] sm:items-start" data-cv-section="header">
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
                    src={snapshot.profile.avatarUrl || "/media/abel-portrait-dark.png"}
                    alt={snapshot.profile.fullName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              ) : null}
            </header>
          ) : null}

          <div className={cn("grid gap-6", pageIndex === 0 ? "pt-6" : "", isCompact ? "text-[11px] leading-5" : "text-xs leading-6")}>
            {pageBlocks.map((block) => (
              <Fragment key={block.key}>{block.node}</Fragment>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function paginatePreviewBlocks(blocks: PreviewBlock[], isCompact: boolean) {
  const firstPageLimit = isCompact ? 13 : 12;
  const nextPageLimit = isCompact ? 15 : 13;
  const pages: PreviewBlock[][] = [];
  let currentPage: PreviewBlock[] = [];
  let currentWeight = 0;
  let limit = firstPageLimit;

  for (const block of blocks) {
    if (currentPage.length && currentWeight + block.weight > limit) {
      pages.push(currentPage);
      currentPage = [];
      currentWeight = 0;
      limit = nextPageLimit;
    }
    currentPage.push(block);
    currentWeight += block.weight;
  }

  if (currentPage.length) {
    pages.push(currentPage);
  }

  return pages.length ? pages : [[]];
}

function skillCategory(skill: PreviewSkillItem) {
  return skill.categoryName || skill.category || "";
}

function isLanguageSkill(skill: PreviewSkillItem) {
  return ["idiomas", "languages"].includes(skillCategory(skill).trim().toLowerCase());
}

function FormationMetadata({ item }: { item: PreviewFormationItem }) {
  const rows = [
    item.description,
    item.url || item.certificateUrl,
    item.credentialId ? `ID: ${item.credentialId}` : ""
  ].filter((value): value is string => Boolean(value));

  if (!rows.length) {
    return null;
  }

  return (
    <div className="mt-1 grid gap-0.5 text-[10px] leading-4 text-slate-500">
      {rows.map((row) => (
        <p key={row}>{row}</p>
      ))}
    </div>
  );
}

function PreviewSection({
  title,
  color,
  section,
  children
}: {
  title: string;
  color: string;
  section: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-2" data-cv-section={section}>
      <h3 className="border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-normal" style={{ color }}>
        {title}
      </h3>
      <div className="text-slate-700">{children}</div>
    </section>
  );
}
