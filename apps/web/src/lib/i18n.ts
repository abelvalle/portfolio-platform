import { portfolioFallback, sections, type PortfolioSnapshot } from "./portfolio-data";

export type Locale = "es" | "en";

type Section = (typeof sections)[number];

export type PublicCopy = {
  ariaSections: string;
  intro: {
    label: string;
    enter: string;
    skip: string;
  };
  hero: {
    downloadCv: string;
    viewCv: string;
    contact: string;
    email: string;
    portraitAlt: string;
  };
  command: {
    trigger: string;
    placeholder: string;
    empty: string;
    navigation: string;
    actions: string;
    goExperience: string;
    goProjects: string;
    contact: string;
    downloadCv: string;
    openLinkedIn: string;
    email: string;
    admin: string;
    switchLanguage: string;
    hiddenAdminLabel: string;
  };
  sections: Section[];
  about: {
    highlight: string;
  };
  experience: {
    current: string;
    results: string;
  };
  projects: {
    sample: string;
  };
  education: {
    typeLabels: Record<string, string>;
  };
  contact: {
    title: string;
    eyebrow: string;
    back: string;
    form: {
      validationError: string;
      success: string;
      submitError: string;
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      subject: string;
      subjectPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      sending: string;
      submit: string;
    };
  };
  cv: {
    eyebrow: string;
    download: string;
    templates: string;
    back: string;
    contact: string;
  };
};

const englishSections: Section[] = [
  { id: "about", label: "About", number: "01" },
  { id: "experience", label: "Experience", number: "02" },
  { id: "projects", label: "Projects", number: "03" },
  { id: "education", label: "Education", number: "04" },
  { id: "skills", label: "Skills", number: "05" },
  { id: "contact", label: "Contact", number: "06" }
];

export const publicCopy: Record<Locale, PublicCopy> = {
  es: {
    ariaSections: "Secciones",
    intro: {
      label: "Portfolio / CV",
      enter: "Entrar",
      skip: "Saltar intro"
    },
    hero: {
      downloadCv: "Descargar CV",
      viewCv: "Ver CV online",
      contact: "Contactar",
      email: "Email",
      portraitAlt: "Retrato de Abel Valle Rosa"
    },
    command: {
      trigger: "Ctrl K",
      placeholder: "Buscar acción...",
      empty: "No hay acciones.",
      navigation: "Navegación",
      actions: "Acciones",
      goExperience: "Ir a experiencia",
      goProjects: "Ir a proyectos",
      contact: "Contactar",
      downloadCv: "Descargar CV",
      openLinkedIn: "Abrir LinkedIn",
      email: "Email",
      admin: "Acceso secreto admin",
      switchLanguage: "Cambiar a English",
      hiddenAdminLabel: "Acceso admin oculto"
    },
    sections,
    about: {
      highlight: "Gestión IT, delivery, cliente, KPIs y UAT como hilo conductor entre negocio y equipos técnicos."
    },
    experience: {
      current: "Actual",
      results: "Resultados"
    },
    projects: {
      sample: "sample/demo"
    },
    education: {
      typeLabels: {
        study: "estudio",
        certification: "certificación",
        course: "curso"
      }
    },
    contact: {
      title: "Construyamos algo juntos.",
      eyebrow: "Contacto",
      back: "Volver al portfolio",
      form: {
        validationError: "Revisa los campos del formulario.",
        success: "Mensaje enviado. Gracias por contactar.",
        submitError: "No se pudo enviar el mensaje. Puedes escribir por email.",
        name: "Nombre",
        namePlaceholder: "Tu nombre",
        email: "Email",
        emailPlaceholder: "tu@email.com",
        subject: "Asunto",
        subjectPlaceholder: "Oportunidad / proyecto / contacto",
        message: "Mensaje",
        messagePlaceholder: "Cuéntame brevemente en qué puedo ayudar.",
        sending: "Enviando...",
        submit: "Enviar mensaje"
      }
    },
    cv: {
      eyebrow: "CV online",
      download: "Descargar CV",
      templates: "Ver plantillas",
      back: "Volver al portfolio",
      contact: "Contacto"
    }
  },
  en: {
    ariaSections: "Sections",
    intro: {
      label: "Portfolio / Resume",
      enter: "Enter",
      skip: "Skip intro"
    },
    hero: {
      downloadCv: "Download resume",
      viewCv: "View resume online",
      contact: "Contact",
      email: "Email",
      portraitAlt: "Portrait of Abel Valle Rosa"
    },
    command: {
      trigger: "Ctrl K",
      placeholder: "Search action...",
      empty: "No actions found.",
      navigation: "Navigation",
      actions: "Actions",
      goExperience: "Go to experience",
      goProjects: "Go to projects",
      contact: "Contact",
      downloadCv: "Download resume",
      openLinkedIn: "Open LinkedIn",
      email: "Email",
      admin: "Secret admin access",
      switchLanguage: "Switch to Español",
      hiddenAdminLabel: "Hidden admin access"
    },
    sections: englishSections,
    about: {
      highlight: "IT management, delivery, clients, KPIs and UAT as the bridge between business and technical teams."
    },
    experience: {
      current: "Present",
      results: "Outcomes"
    },
    projects: {
      sample: "sample/demo"
    },
    education: {
      typeLabels: {
        study: "study",
        certification: "certification",
        course: "course"
      }
    },
    contact: {
      title: "Let's build something together.",
      eyebrow: "Contact",
      back: "Back to portfolio",
      form: {
        validationError: "Please review the form fields.",
        success: "Message sent. Thanks for reaching out.",
        submitError: "The message could not be sent. You can write by email.",
        name: "Name",
        namePlaceholder: "Your name",
        email: "Email",
        emailPlaceholder: "you@email.com",
        subject: "Subject",
        subjectPlaceholder: "Opportunity / project / contact",
        message: "Message",
        messagePlaceholder: "Briefly tell me how I can help.",
        sending: "Sending...",
        submit: "Send message"
      }
    },
    cv: {
      eyebrow: "Online resume",
      download: "Download resume",
      templates: "View templates",
      back: "Back to portfolio",
      contact: "Contact"
    }
  }
};

export function getPortfolioPath(locale: Locale) {
  return locale === "en" ? "/en" : "/";
}

export function getCvPath(locale: Locale) {
  return locale === "en" ? "/en/cv" : "/cv";
}

export function getCvTemplatesPath(locale: Locale) {
  return locale === "en" ? "/en/cv/templates" : "/cv/templates";
}

export function getCvTemplatePath(locale: Locale, slug: string) {
  return `${getCvTemplatesPath(locale)}/${slug}`;
}

export function getContactPath(locale: Locale) {
  return locale === "en" ? "/en/contact" : "/contact";
}

export function getAlternateLocalePath(locale: Locale) {
  return locale === "en" ? "/" : "/en";
}

export function localizeSnapshot(snapshot: PortfolioSnapshot, locale: Locale): PortfolioSnapshot {
  if (locale === "es") {
    return snapshot;
  }

  return {
    ...snapshot,
    profile: {
      ...snapshot.profile,
      subtitle: "Agile Project Management | KPIs · UAT · Client | Cloud & DevOps",
      location: "Seville, Spain",
      availability: "Available for IT Project / Delivery Management opportunities",
      shortBio:
        "IT Project Manager with 6+ years leading enterprise IT projects, owning delivery with clients and business stakeholders.",
      longBio:
        "Hybrid business-technical profile specialized in Delivery Management, agile Scrum/Kanban practices, KPI-based tracking and User Acceptance Testing processes. Direct client experience in kick-offs, scope definition, backlog refinement, sprint planning, demos, risk management and final validation."
    },
    experiences: snapshot.experiences.map((experience) => {
      const copy = experienceTranslations[experience.company];
      return copy ? { ...experience, ...copy } : experience;
    }),
    education: snapshot.education.map((item) => ({ ...item, ...educationTranslations[item.title] })),
    certifications: snapshot.certifications.map((item) => ({ ...item, ...educationTranslations[item.title] })),
    skills: snapshot.skills.map((skill) => ({
      ...skill,
      name: skillNameTranslations[skill.name] || skill.name,
      category: skillCategoryTranslations[skill.category] || skill.category
    })),
    projects: snapshot.projects.map((project) => ({
      ...project,
      description: projectDescriptionTranslations[project.name] || project.description,
      category: projectCategoryTranslations[project.category] || project.category
    })),
    cv: {
      ...snapshot.cv,
      name: "General Resume Abel Valle Rosa",
      summary:
        "IT Project Manager with 6+ years leading enterprise IT projects, specialized in Delivery Management, agile practices, KPIs, UAT, client relationship, Cloud and DevOps."
    }
  };
}

export function getLocalizedFallback(locale: Locale): PortfolioSnapshot {
  return localizeSnapshot(portfolioFallback, locale);
}

export type PublicTranslationEntry = {
  namespace: string;
  key: string;
  value: string;
};

export type PublicTranslationDictionary = Record<string, unknown>;

export function applyPublicDictionary(copy: PublicCopy, dictionary: PublicTranslationDictionary): PublicCopy {
  const nextCopy = JSON.parse(JSON.stringify(copy)) as PublicCopy;
  mergeExistingStrings(nextCopy as unknown as Record<string, unknown>, dictionary);
  return nextCopy;
}

export function applyPublicTranslations(copy: PublicCopy, entries: PublicTranslationEntry[]): PublicCopy {
  const nextCopy = JSON.parse(JSON.stringify(copy)) as PublicCopy;

  for (const entry of entries) {
    const namespace = entry.namespace.startsWith("public.") ? entry.namespace.slice("public.".length) : entry.namespace;
    const path = [...namespace.split("."), ...entry.key.split(".")].filter(Boolean);
    setExistingString(nextCopy as unknown as Record<string, unknown>, path, entry.value);
  }

  return nextCopy;
}

function mergeExistingStrings(target: Record<string, unknown>, source: PublicTranslationDictionary) {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (typeof current === "string" && typeof value === "string") {
      target[key] = value;
      continue;
    }
    if (Array.isArray(current) && isPlainObject(value)) {
      mergeExistingArrayStrings(current, value);
      continue;
    }
    if (isPlainObject(current) && isPlainObject(value)) {
      mergeExistingStrings(current, value);
    }
  }
}

function mergeExistingArrayStrings(target: unknown[], source: PublicTranslationDictionary) {
  for (const [key, value] of Object.entries(source)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= target.length) {
      continue;
    }
    const current = target[index];
    if (typeof current === "string" && typeof value === "string") {
      target[index] = value;
      continue;
    }
    if (isPlainObject(current) && isPlainObject(value)) {
      mergeExistingStrings(current, value);
    }
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function setExistingString(target: Record<string, unknown>, path: string[], value: string) {
  const [head, ...tail] = path;
  if (!head) {
    return;
  }
  if (!tail.length) {
    if (typeof target[head] === "string") {
      target[head] = value;
    }
    return;
  }
  const next = target[head];
  if (next && typeof next === "object" && !Array.isArray(next)) {
    setExistingString(next as Record<string, unknown>, tail, value);
  }
}

const experienceTranslations: Record<string, Partial<PortfolioSnapshot["experiences"][number]>> = {
  "Experis ManpowerGroup": {
    description:
      "Final owner of project delivery with the client, ensuring objectives, quality and delivery commitments in enterprise environments.",
    achievements: [
      "Improved delivery predictability and reduced post-release rework.",
      "Stronger alignment between business, client and technical team."
    ],
    responsibilities: [
      "Main client point of contact, managing expectations, priorities and commitments.",
      "Led kick-offs, scope definition and success criteria.",
      "Managed backlog, sprint planning, estimates and team follow-up.",
      "Tracked delivery and sprint KPIs, reporting status and deviations to stakeholders.",
      "Led Sprint Reviews with the client and coordinated UAT processes.",
      "Managed risks, blockers and incidents with transparent communication."
    ],
    skills: ["Delivery Management", "Stakeholder Management", "KPIs and Reporting", "UAT"]
  },
  Avanade: {
    description: "Technical and functional coordination of a team specialized in .NET and Xamarin for web and mobile applications.",
    responsibilities: [
      "Organized dailies, sprint planning and task follow-up.",
      "Defined and tracked agile KPIs such as velocity and completion rate.",
      "Validated deliverables and code quality during the SDLC.",
      "Handled technical client communication to align priorities, risks and expectations."
    ],
    skills: ["Leadership", "Planning", "KPIs", "Client communication"]
  },
  Idener: {
    description: "Participation across the full software lifecycle, from functional analysis to production deployment.",
    responsibilities: [
      "Designed and implemented full stack solutions.",
      "Supported quality, performance and scalability.",
      "Handled system integrations and migrations from legacy platforms."
    ],
    skills: ["Full Stack", "System integration", "REST APIs"]
  },
  Everis: {
    role: "Full-Stack Developer / Technical Co-Lead",
    description: "Supported technical team coordination in an international project for the tourism sector.",
    responsibilities: [
      "Contributed to technical decisions and workflow improvements.",
      "Implemented code quality metrics.",
      "Reviewed functional deliverables.",
      "Planned releases and coordinated development, QA and business."
    ],
    skills: ["Technical coordination", "QA", "Release planning"]
  },
  "Consultoría y desarrollo": {
    company: "Consulting and development",
    role: "Technical roles in consulting and development",
    description:
      "Participation in application integration and modernization projects with Java, .NET and AngularJS in public and private sectors.",
    responsibilities: [
      "Developed and maintained web applications.",
      "Built a technical foundation and evolved progressively toward IT leadership and management roles."
    ],
    skills: ["Software development", "Modernization", "Integration"]
  }
};

const educationTranslations: Record<string, Partial<PortfolioSnapshot["education"][number]>> = {
  "ITIL® 4 Foundation": {
    description: "Certification listed in the current CV."
  },
  "Iniciación al Desarrollo con IA": {
    title: "Introduction to AI Development",
    description: "Course listed in the current CV."
  },
  "Scrum Foundation Professional Certificate": {
    description: "Scrum certification listed in the 2024, 2025 and 2026 CVs."
  },
  "Agile Methodology with Kanban": {
    description: "Training/certification in agile methodology with Kanban."
  },
  "CFGS Desarrollo de Aplicaciones Informáticas": {
    title: "Higher Vocational Training in Software Application Development",
    description: "Higher education in software application development."
  }
};

const skillNameTranslations: Record<string, string> = {
  "Gestión de Proyectos IT": "IT Project Management",
  "Gestión Ágil (Scrum / Kanban)": "Agile Management (Scrum / Kanban)",
  "Gestión de Stakeholders": "Stakeholder Management",
  "KPIs y Reporting": "KPIs and Reporting",
  "Comunicación con cliente": "Client Communication",
  "Bases de datos": "Databases",
  "Arquitectura Limpia": "Clean Architecture",
  "Microservicios": "Microservices",
  "Español nativo": "Native Spanish",
  "Inglés B1": "English B1"
};

const skillCategoryTranslations: Record<string, string> = {
  "Gestión de proyectos": "Project Management",
  "Lenguajes y Frameworks": "Languages and Frameworks",
  "Bases de datos": "Databases",
  Herramientas: "Tools",
  "Testing y Calidad": "Testing and Quality",
  "Arquitectura y Diseño": "Architecture and Design",
  Idiomas: "Languages"
};

const projectDescriptionTranslations: Record<string, string> = {
  "Portfolio Platform":
    "Demo project: modular portfolio/resume platform with Next.js frontend, NestJS API, PostgreSQL, Prisma and CV Manager.",
  "CV Role Adaptation Engine":
    "Demo project: rule-based engine to adapt resume versions to job offers without inventing professional data."
};

const projectCategoryTranslations: Record<string, string> = {
  "Demo / Portfolio": "Demo / Portfolio",
  "Demo / CV Manager": "Demo / CV Manager"
};
