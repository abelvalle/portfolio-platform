import { PrismaClient, PublishStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import {
  abelEducation,
  abelExperiences,
  abelProfile,
  abelSkills,
  cvSummary,
  demoProjects
} from "../../../packages/shared/src/index";

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "abel.valle.rosa@gmail.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { name: "Abel Valle Rosa", role: UserRole.admin },
    create: { email, name: "Abel Valle Rosa", role: UserRole.admin, passwordHash }
  });
}

async function seedProfile() {
  const existing = await prisma.profile.findFirst();
  const data = {
    ...abelProfile,
    avatarUrl: "/media/abel-portrait-dark.png",
    cvUrl: "/media/Abel_Valle_Rosa_CV_ES.pdf",
    seoTitle: "Abel Valle Rosa | IT Project Manager",
    seoDescription: cvSummary,
    ogImageUrl: "/media/abel-portrait-formal.jpg"
  };

  if (existing) {
    await prisma.profile.update({ where: { id: existing.id }, data });
  } else {
    await prisma.profile.create({ data });
  }

  const theme = await prisma.themeSettings.findFirst();
  const themeData = {
    primaryColor: "#5eead4",
    secondaryColor: "#94a3b8",
    backgroundColor: "#07090d",
    textColor: "#f8fafc",
    fontFamily: "Inter",
    borderRadius: "8px",
    cardStyle: "subtle",
    animationIntensity: "medium",
    colorMode: "dark",
    publishedAt: new Date()
  };

  if (theme) {
    await prisma.themeSettings.update({ where: { id: theme.id }, data: themeData });
  } else {
    await prisma.themeSettings.create({ data: themeData });
  }
}

async function seedExperiences() {
  for (const [index, experience] of abelExperiences.entries()) {
    await prisma.experience.upsert({
      where: { id: `seed-exp-${index}` },
      update: {
        ...experience,
        startDate: new Date(experience.startDate),
        endDate: experience.endDate ? new Date(experience.endDate) : null,
        order: index
      },
      create: {
        id: `seed-exp-${index}`,
        ...experience,
        startDate: new Date(experience.startDate),
        endDate: experience.endDate ? new Date(experience.endDate) : null,
        order: index
      }
    });
  }
}

async function seedEducationAndCertifications() {
  for (const [index, item] of abelEducation.entries()) {
    if (item.type === "study") {
      await prisma.education.upsert({
        where: { id: `seed-edu-${index}` },
        update: { ...item, order: index },
        create: { id: `seed-edu-${index}`, ...item, order: index }
      });
    } else {
      await prisma.certification.upsert({
        where: { id: `seed-cert-${index}` },
        update: { ...item, order: index },
        create: { id: `seed-cert-${index}`, ...item, order: index }
      });
    }
  }
}

async function seedSkills() {
  const categories = [...new Set(abelSkills.map((skill) => skill.category))];
  const categoryIds = new Map<string, string>();

  for (const [index, name] of categories.entries()) {
    const category = await prisma.skillCategory.upsert({
      where: { name },
      update: { order: index },
      create: { name, order: index }
    });
    categoryIds.set(name, category.id);
  }

  for (const [index, skill] of abelSkills.entries()) {
    await prisma.skill.upsert({
      where: { id: `seed-skill-${index}` },
      update: {
        name: skill.name,
        categoryName: skill.category,
        categoryId: categoryIds.get(skill.category),
        level: skill.level,
        order: index
      },
      create: {
        id: `seed-skill-${index}`,
        name: skill.name,
        categoryName: skill.category,
        categoryId: categoryIds.get(skill.category),
        level: skill.level,
        order: index
      }
    });
  }
}

async function seedProjects() {
  for (const [index, project] of demoProjects.entries()) {
    const category = await prisma.projectCategory.upsert({
      where: { name: project.category },
      update: {},
      create: { name: project.category, order: index }
    });

    await prisma.project.upsert({
      where: { slug: slugify(project.name) },
      update: {
        description: project.description,
        status: project.status as PublishStatus,
        categoryId: category.id,
        categoryName: project.category,
        technologies: project.technologies,
        featured: project.featured,
        sample: project.sample,
        visible: project.status !== "archived",
        order: index
      },
      create: {
        name: project.name,
        slug: slugify(project.name),
        description: project.description,
        status: project.status as PublishStatus,
        categoryId: category.id,
        categoryName: project.category,
        technologies: project.technologies,
        featured: project.featured,
        sample: project.sample,
        visible: project.status !== "archived",
        order: index
      }
    });
  }
}

async function seedCv() {
  const structuredJson = {
    profile: abelProfile,
    summary: cvSummary,
    experiences: abelExperiences,
    education: abelEducation.filter((item) => item.type === "study"),
    certifications: abelEducation.filter((item) => item.type !== "study"),
    skills: abelSkills,
    languages: [
      { name: "Español", level: "Nativo" },
      { name: "Inglés", level: "B1" }
    ],
    sourceFiles: [
      "D:/08DocumentosAbel/Abel_Valle_Rosa_CV_ES.docx",
      "D:/08DocumentosAbel/Abel_Valle_Rosa_CV_ES.pdf",
      "D:/08DocumentosAbel/old/CV-Abel-2025.pdf",
      "D:/08DocumentosAbel/old/CV-Abel-Valle-2024.pdf"
    ]
  };

  const cv = await prisma.cv.upsert({
    where: { slug: "abel-valle-rosa-cv-general" },
    update: {
      name: "CV General Abel Valle Rosa",
      headline: abelProfile.headline,
      summary: cvSummary,
      contactJson: {
        email: abelProfile.email,
        phone: abelProfile.phone,
        location: abelProfile.location,
        linkedin: abelProfile.linkedin
      },
      linksJson: { linkedin: abelProfile.linkedin, github: abelProfile.github },
      structuredJson,
      isPrimary: true,
      status: PublishStatus.published
    },
    create: {
      slug: "abel-valle-rosa-cv-general",
      name: "CV General Abel Valle Rosa",
      headline: abelProfile.headline,
      summary: cvSummary,
      contactJson: {
        email: abelProfile.email,
        phone: abelProfile.phone,
        location: abelProfile.location,
        linkedin: abelProfile.linkedin
      },
      linksJson: { linkedin: abelProfile.linkedin, github: abelProfile.github },
      structuredJson,
      isPrimary: true,
      status: PublishStatus.published
    }
  });

  const sections = [
    ["personal", "Información personal", structuredJson.profile],
    ["summary", "Resumen profesional", structuredJson.summary],
    ["experience", "Experiencia", structuredJson.experiences],
    ["education", "Educación", structuredJson.education],
    ["certifications", "Certificaciones", structuredJson.certifications],
    ["skills", "Skills", structuredJson.skills],
    ["languages", "Idiomas", structuredJson.languages]
  ] as const;

  await prisma.cvSection.deleteMany({ where: { cvId: cv.id } });
  for (const [index, [key, title, content]] of sections.entries()) {
    await prisma.cvSection.create({
      data: { cvId: cv.id, key, title, content, order: index, visible: true }
    });
  }

  const templates = [
    ["Minimalista", "minimalista", "CV sobrio y claro para lectura ejecutiva."],
    ["Ejecutiva", "ejecutiva", "Plantilla con presencia directiva y foco en logros."],
    ["Técnica", "tecnica", "Plantilla orientada a skills, stack y proyectos."],
    ["ATS-friendly", "ats-friendly", "Plantilla sin ornamento para sistemas ATS."],
    ["Una página", "una-pagina", "Versión compacta para roles concretos."],
    ["Dos páginas", "dos-paginas", "Versión completa con más contexto."]
  ];

  let firstTemplateId: string | undefined;
  for (const [index, [name, slug, description]] of templates.entries()) {
    const template = await prisma.cvTemplate.upsert({
      where: { slug },
      update: { name, description, order: index },
      create: {
        name,
        slug,
        description,
        order: index,
        config: {
          fontFamily: "Inter",
          primaryColor: "#0f766e",
          includePhoto: slug !== "ats-friendly",
          includeIcons: slug !== "ats-friendly",
          density: slug === "una-pagina" ? "compact" : "normal"
        }
      }
    });
    firstTemplateId ||= template.id;
  }

  const version = await prisma.cvVersion.upsert({
    where: { slug: "cv-general-project-manager" },
    update: {
      cvId: cv.id,
      templateId: firstTemplateId,
      name: "CV general",
      targetRole: "IT Project Manager",
      status: PublishStatus.published,
      structuredJson,
      isPrimary: true
    },
    create: {
      cvId: cv.id,
      templateId: firstTemplateId,
      name: "CV general",
      slug: "cv-general-project-manager",
      description: "Versión base generada desde los CVs adjuntos.",
      targetRole: "IT Project Manager",
      status: PublishStatus.published,
      structuredJson,
      isPrimary: true
    }
  });

  await prisma.cvTargetRole.createMany({
    data: [
      { name: "Project Manager", keywords: ["project", "scrum", "stakeholders", "kpi"] },
      { name: "Delivery Manager", keywords: ["delivery", "cliente", "uat", "reporting"] },
      { name: "IT Project Manager", keywords: ["it", "cloud", "devops", "api", "delivery"] },
      { name: "Agile Project Manager", keywords: ["scrum", "kanban", "sprint", "retrospective"] },
      { name: "Cloud / DevOps oriented roles", keywords: ["azure", "docker", "kubernetes", "ci/cd"] }
    ],
    skipDuplicates: true
  });

  return version;
}

async function seedPageSectionsAndModules() {
  const sections = [
    ["about", "Sobre mí"],
    ["experience", "Experiencia"],
    ["projects", "Proyectos"],
    ["education", "Estudios y certificaciones"],
    ["skills", "Skills"],
    ["contact", "Contacto"]
  ];

  for (const [index, [key, title]] of sections.entries()) {
    await prisma.pageSection.upsert({
      where: { key },
      update: { title, order: index, visible: true },
      create: { key, title, order: index, content: {} }
    });
  }

  const modules = [
    ["dashboard", "Dashboard"],
    ["portfolio", "Portfolio"],
    ["cv-manager", "CV Manager"],
    ["projects", "Proyectos"],
    ["messages", "Mensajes"],
    ["analytics", "Analítica"],
    ["media", "Media"],
    ["settings", "Configuración"],
    ["future-modules", "Módulos futuros"]
  ];

  for (const [index, [key, name]] of modules.entries()) {
    await prisma.appModule.upsert({
      where: { key },
      update: { name, order: index, enabled: true },
      create: { key, name, order: index, enabled: true }
    });
  }

  const funnelDefinitions = [
    {
      key: "landing-cv-contact",
      name: "Landing -> CV -> Contacto",
      description: "Embudo principal de conversion publica.",
      steps: ["landing_visit", "cv_download", "contact_submit"]
    },
    {
      key: "landing-project-contact",
      name: "Landing -> Proyecto -> Contacto",
      description: "Valida el interes generado por proyectos destacados.",
      steps: ["landing_visit", "project_view", "contact_submit"]
    },
    {
      key: "landing-linkedin-cv",
      name: "Landing -> LinkedIn -> CV",
      description: "Mide investigacion de perfil antes de descargar CV.",
      steps: ["landing_visit", "linkedin_click", "cv_download"]
    }
  ];

  for (const [index, definition] of funnelDefinitions.entries()) {
    await prisma.analyticsFunnelDefinition.upsert({
      where: { key: definition.key },
      update: { ...definition, order: index, visible: true },
      create: { ...definition, order: index, visible: true }
    });
  }

  const translations = [
    ["es", "public", "ariaSections", "Secciones"],
    ["es", "public.intro", "label", "Portfolio / CV"],
    ["es", "public.intro", "enter", "Entrar"],
    ["es", "public.intro", "skip", "Saltar intro"],
    ["es", "public.hero", "downloadCv", "Descargar CV"],
    ["es", "public.hero", "viewCv", "Ver CV online"],
    ["es", "public.hero", "contact", "Contactar"],
    ["es", "public.hero", "email", "Email"],
    ["es", "public.hero", "portraitAlt", "Retrato de Abel Valle Rosa"],
    ["es", "public.command", "trigger", "Ctrl K"],
    ["es", "public.command", "placeholder", "Buscar accion..."],
    ["es", "public.command", "empty", "No hay acciones."],
    ["es", "public.command", "navigation", "Navegacion"],
    ["es", "public.command", "actions", "Acciones"],
    ["es", "public.command", "goExperience", "Ir a experiencia"],
    ["es", "public.command", "goProjects", "Ir a proyectos"],
    ["es", "public.command", "contact", "Contactar"],
    ["es", "public.command", "downloadCv", "Descargar CV"],
    ["es", "public.command", "openLinkedIn", "Abrir LinkedIn"],
    ["es", "public.command", "email", "Email"],
    ["es", "public.command", "admin", "Acceso secreto admin"],
    ["es", "public.command", "switchLanguage", "Cambiar a English"],
    ["es", "public.command", "hiddenAdminLabel", "Acceso admin oculto"],
    [
      "es",
      "public.about",
      "highlight",
      "Gestion IT, delivery, cliente, KPIs y UAT como hilo conductor entre negocio y equipos tecnicos."
    ],
    ["es", "public.experience", "current", "Actual"],
    ["es", "public.experience", "results", "Resultados"],
    ["es", "public.projects", "sample", "sample/demo"],
    ["es", "public.education.typeLabels", "study", "estudio"],
    ["es", "public.education.typeLabels", "certification", "certificacion"],
    ["es", "public.education.typeLabels", "course", "curso"],
    ["es", "public.contact", "title", "Construyamos algo juntos."],
    ["es", "public.contact", "eyebrow", "Contacto"],
    ["es", "public.contact", "back", "Volver al portfolio"],
    ["es", "public.contact.form", "validationError", "Revisa los campos del formulario."],
    ["es", "public.contact.form", "success", "Mensaje enviado. Gracias por contactar."],
    ["es", "public.contact.form", "submitError", "No se pudo enviar el mensaje. Puedes escribir por email."],
    ["es", "public.contact.form", "name", "Nombre"],
    ["es", "public.contact.form", "namePlaceholder", "Tu nombre"],
    ["es", "public.contact.form", "email", "Email"],
    ["es", "public.contact.form", "emailPlaceholder", "tu@email.com"],
    ["es", "public.contact.form", "subject", "Asunto"],
    ["es", "public.contact.form", "subjectPlaceholder", "Oportunidad / proyecto / contacto"],
    ["es", "public.contact.form", "message", "Mensaje"],
    ["es", "public.contact.form", "messagePlaceholder", "Cuentame brevemente en que puedo ayudar."],
    ["es", "public.contact.form", "sending", "Enviando..."],
    ["es", "public.contact.form", "submit", "Enviar mensaje"],
    ["es", "public.cv", "eyebrow", "CV online"],
    ["es", "public.cv", "download", "Descargar CV"],
    ["es", "public.cv", "templates", "Ver plantillas"],
    ["es", "public.cv", "back", "Volver al portfolio"],
    ["es", "public.cv", "contact", "Contacto"],
    ["en", "public", "ariaSections", "Sections"],
    ["en", "public.intro", "label", "Portfolio / Resume"],
    ["en", "public.intro", "enter", "Enter"],
    ["en", "public.intro", "skip", "Skip intro"],
    ["en", "public.hero", "downloadCv", "Download resume"],
    ["en", "public.hero", "viewCv", "View resume online"],
    ["en", "public.hero", "contact", "Contact"],
    ["en", "public.hero", "email", "Email"],
    ["en", "public.hero", "portraitAlt", "Portrait of Abel Valle Rosa"],
    ["en", "public.command", "trigger", "Ctrl K"],
    ["en", "public.command", "placeholder", "Search action..."],
    ["en", "public.command", "empty", "No actions found."],
    ["en", "public.command", "navigation", "Navigation"],
    ["en", "public.command", "actions", "Actions"],
    ["en", "public.command", "goExperience", "Go to experience"],
    ["en", "public.command", "goProjects", "Go to projects"],
    ["en", "public.command", "contact", "Contact"],
    ["en", "public.command", "downloadCv", "Download resume"],
    ["en", "public.command", "openLinkedIn", "Open LinkedIn"],
    ["en", "public.command", "email", "Email"],
    ["en", "public.command", "admin", "Secret admin access"],
    ["en", "public.command", "switchLanguage", "Switch to Espanol"],
    ["en", "public.command", "hiddenAdminLabel", "Hidden admin access"],
    [
      "en",
      "public.about",
      "highlight",
      "IT management, delivery, clients, KPIs and UAT as the bridge between business and technical teams."
    ],
    ["en", "public.experience", "current", "Present"],
    ["en", "public.experience", "results", "Outcomes"],
    ["en", "public.projects", "sample", "sample/demo"],
    ["en", "public.education.typeLabels", "study", "study"],
    ["en", "public.education.typeLabels", "certification", "certification"],
    ["en", "public.education.typeLabels", "course", "course"],
    ["en", "public.contact", "title", "Let's build something together."],
    ["en", "public.contact", "eyebrow", "Contact"],
    ["en", "public.contact", "back", "Back to portfolio"],
    ["en", "public.contact.form", "validationError", "Please review the form fields."],
    ["en", "public.contact.form", "success", "Message sent. Thanks for reaching out."],
    ["en", "public.contact.form", "submitError", "The message could not be sent. You can write by email."],
    ["en", "public.contact.form", "name", "Name"],
    ["en", "public.contact.form", "namePlaceholder", "Your name"],
    ["en", "public.contact.form", "email", "Email"],
    ["en", "public.contact.form", "emailPlaceholder", "you@email.com"],
    ["en", "public.contact.form", "subject", "Subject"],
    ["en", "public.contact.form", "subjectPlaceholder", "Opportunity / project / contact"],
    ["en", "public.contact.form", "message", "Message"],
    ["en", "public.contact.form", "messagePlaceholder", "Briefly tell me how I can help."],
    ["en", "public.contact.form", "sending", "Sending..."],
    ["en", "public.contact.form", "submit", "Send message"],
    ["en", "public.cv", "eyebrow", "Online resume"],
    ["en", "public.cv", "download", "Download resume"],
    ["en", "public.cv", "templates", "View templates"],
    ["en", "public.cv", "back", "Back to portfolio"],
    ["en", "public.cv", "contact", "Contact"]
  ];

  for (const [locale, namespace, key, value] of translations) {
    await prisma.translationEntry.upsert({
      where: { locale_namespace_key: { locale, namespace, key } },
      update: { value, visible: true },
      create: {
        locale,
        namespace,
        key,
        value,
        description: "Editable public UI copy",
        visible: true
      }
    });
  }
}

async function main() {
  await seedAdmin();
  await seedProfile();
  await seedExperiences();
  await seedEducationAndCertifications();
  await seedSkills();
  await seedProjects();
  await seedCv();
  await seedPageSectionsAndModules();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
