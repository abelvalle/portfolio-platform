export type CvTemplateConfig = {
  fontFamily?: string;
  primaryColor?: string;
  includePhoto?: boolean;
  includeIcons?: boolean;
  density?: string;
};

export type CvTemplateItem = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  config: CvTemplateConfig;
  visible?: boolean;
  order?: number;
  updatedAt?: string;
};

export const cvTemplateFallbacks: CvTemplateItem[] = [
  {
    name: "Minimalista",
    slug: "minimalista",
    description: "CV sobrio y claro para lectura ejecutiva.",
    config: { fontFamily: "Inter", primaryColor: "#0f766e", includePhoto: true, includeIcons: true, density: "normal" }
  },
  {
    name: "Ejecutiva",
    slug: "ejecutiva",
    description: "Plantilla con presencia directiva y foco en logros.",
    config: { fontFamily: "Inter", primaryColor: "#0f766e", includePhoto: true, includeIcons: true, density: "normal" }
  },
  {
    name: "Tecnica",
    slug: "tecnica",
    description: "Plantilla orientada a skills, stack y proyectos.",
    config: { fontFamily: "Inter", primaryColor: "#0f766e", includePhoto: true, includeIcons: true, density: "normal" }
  },
  {
    name: "ATS-friendly",
    slug: "ats-friendly",
    description: "Plantilla sin ornamento para sistemas ATS.",
    config: { fontFamily: "Inter", primaryColor: "#0f766e", includePhoto: false, includeIcons: false, density: "normal" }
  },
  {
    name: "Una pagina",
    slug: "una-pagina",
    description: "Version compacta para roles concretos.",
    config: { fontFamily: "Inter", primaryColor: "#0f766e", includePhoto: true, includeIcons: true, density: "compact" }
  },
  {
    name: "Dos paginas",
    slug: "dos-paginas",
    description: "Version completa con mas contexto.",
    config: { fontFamily: "Inter", primaryColor: "#0f766e", includePhoto: true, includeIcons: true, density: "normal" }
  }
];

export function normalizeCvTemplates(input: unknown): CvTemplateItem[] {
  if (!Array.isArray(input)) {
    return cvTemplateFallbacks;
  }

  const templates = input
    .map((item) => normalizeCvTemplate(item))
    .filter((template): template is CvTemplateItem => Boolean(template));

  return templates.length ? templates : cvTemplateFallbacks;
}

export function getCvTemplateFeatures(template: CvTemplateItem, locale: "es" | "en") {
  const copy =
    locale === "en"
      ? {
          font: "Font",
          compact: "Compact density",
          normal: "Balanced density",
          photo: "Optional photo",
          noPhoto: "No photo",
          icons: "Icons enabled",
          noIcons: "Text only"
        }
      : {
          font: "Tipografia",
          compact: "Densidad compacta",
          normal: "Densidad equilibrada",
          photo: "Foto opcional",
          noPhoto: "Sin foto",
          icons: "Iconos activos",
          noIcons: "Solo texto"
        };

  return [
    `${copy.font}: ${template.config.fontFamily || "Inter"}`,
    template.config.density === "compact" ? copy.compact : copy.normal,
    template.config.includePhoto === false ? copy.noPhoto : copy.photo,
    template.config.includeIcons === false ? copy.noIcons : copy.icons
  ];
}

function normalizeCvTemplate(item: unknown): CvTemplateItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  if (typeof record.name !== "string" || typeof record.slug !== "string") {
    return null;
  }

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    name: record.name,
    slug: record.slug,
    description: typeof record.description === "string" ? record.description : null,
    config: normalizeTemplateConfig(record.config),
    visible: typeof record.visible === "boolean" ? record.visible : undefined,
    order: typeof record.order === "number" ? record.order : undefined,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined
  };
}

function normalizeTemplateConfig(config: unknown): CvTemplateConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }

  const record = config as Record<string, unknown>;
  return {
    fontFamily: typeof record.fontFamily === "string" ? record.fontFamily : undefined,
    primaryColor: typeof record.primaryColor === "string" ? record.primaryColor : undefined,
    includePhoto: typeof record.includePhoto === "boolean" ? record.includePhoto : undefined,
    includeIcons: typeof record.includeIcons === "boolean" ? record.includeIcons : undefined,
    density: typeof record.density === "string" ? record.density : undefined
  };
}
