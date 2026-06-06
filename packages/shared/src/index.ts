export type VisibilityStatus = "draft" | "published" | "archived";

export type ProfileSeed = {
  fullName: string;
  headline: string;
  subtitle: string;
  location: string;
  availability: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  shortBio: string;
  longBio: string;
};

export type ExperienceSeed = {
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  location: string;
  modality: "remote" | "hybrid" | "onsite" | "not_specified";
  description: string;
  achievements: string[];
  responsibilities: string[];
  technologies: string[];
  methodologies: string[];
  skills: string[];
  featured: boolean;
};

export type EducationSeed = {
  title: string;
  institution: string;
  date: string;
  type: "study" | "certification" | "course";
  description: string;
  url?: string;
  certificateUrl?: string;
  credentialId?: string;
};

export type SkillSeed = {
  name: string;
  category: string;
  level?: string;
};

export type ProjectSeed = {
  name: string;
  description: string;
  status: VisibilityStatus;
  category: string;
  technologies: string[];
  featured: boolean;
  sample: boolean;
};

export const abelProfile: ProfileSeed = {
  fullName: "Abel Valle Rosa",
  headline: "IT Project Manager | Delivery Manager",
  subtitle: "Gestión Ágil de Proyectos | KPIs · UAT · Cliente | Cloud & DevOps",
  location: "Sevilla, España",
  availability: "Disponible para oportunidades IT Project / Delivery Management",
  email: "abel.valle.rosa@gmail.com",
  phone: "+34 637 547 590",
  linkedin: "https://www.linkedin.com/in/abelvros/",
  github: "",
  shortBio:
    "IT Project Manager con más de 6 años liderando proyectos IT en entornos enterprise, responsable del delivery frente a cliente y negocio.",
  longBio:
    "Perfil híbrido negocio-técnico especializado en Delivery Management, gestión ágil Scrum/Kanban, seguimiento por KPIs y procesos de User Acceptance Testing. Experiencia directa con cliente en kick-offs, definición de alcance, refinamiento de backlog, planificación de sprints, demos, gestión de riesgos y validación final."
};

export const abelExperiences: ExperienceSeed[] = [
  {
    company: "Experis ManpowerGroup",
    role: "Project Manager / Senior Consultant",
    startDate: "2022-01-01",
    endDate: null,
    current: true,
    location: "Sevilla",
    modality: "not_specified",
    description:
      "Responsable último del delivery del proyecto frente a cliente, asegurando objetivos, calidad y compromisos de entrega en entornos enterprise.",
    achievements: [
      "Mejora de la predictibilidad del delivery y reducción de retrabajos post-release.",
      "Mayor alineación entre negocio, cliente y equipo técnico."
    ],
    responsibilities: [
      "Punto de contacto principal con cliente, gestionando expectativas, prioridades y compromisos.",
      "Liderazgo de kick-offs, definición de alcance y criterios de éxito.",
      "Gestión de backlog, planificación de sprints, estimaciones y seguimiento del equipo.",
      "Seguimiento de KPIs de delivery y sprint, reportando estado y desviaciones a stakeholders.",
      "Liderazgo de Sprint Reviews con cliente y coordinación de procesos UAT.",
      "Gestión de riesgos, bloqueos e incidencias con comunicación transparente."
    ],
    technologies: ["C#", ".NET", "Angular", "SQL Server", "Azure", "Cypress", "Postman", "SonarQube"],
    methodologies: ["Scrum", "UAT", "KPIs", "Sprint Reviews", "Retrospectivas"],
    skills: ["Delivery Management", "Gestión de Stakeholders", "KPIs y Reporting", "UAT"],
    featured: true
  },
  {
    company: "Avanade",
    role: "Team Leader / Senior Analyst",
    startDate: "2021-01-01",
    endDate: "2022-01-01",
    current: false,
    location: "Sevilla",
    modality: "not_specified",
    description:
      "Coordinación técnica y funcional de un equipo especializado en .NET y Xamarin para aplicaciones web y móvil.",
    achievements: [],
    responsibilities: [
      "Organización de dailys, planificación de sprints y seguimiento de tareas.",
      "Definición y seguimiento de KPIs ágiles como velocidad y tasa de finalización.",
      "Validación de entregables y calidad de código durante el SDLC.",
      "Interlocución técnica con cliente para alinear prioridades, riesgos y expectativas."
    ],
    technologies: [".NET", "Blazor", "Xamarin", "SQL Server", "Docker", "Azure DevOps", "AKS"],
    methodologies: ["Scrum", "Agile", "SDLC"],
    skills: ["Liderazgo", "Planificación", "KPIs", "Comunicación con cliente"],
    featured: true
  },
  {
    company: "Idener",
    role: "Analyst Developer / Full Stack Engineer",
    startDate: "2019-01-01",
    endDate: "2021-01-01",
    current: false,
    location: "Sevilla",
    modality: "not_specified",
    description:
      "Participación en todo el ciclo de vida del software, desde análisis funcional hasta despliegue en producción.",
    achievements: [],
    responsibilities: [
      "Diseño e implementación de soluciones full stack.",
      "Garantía de calidad, rendimiento y escalabilidad.",
      "Integraciones de sistemas y migraciones desde plataformas legacy."
    ],
    technologies: ["C#", ".NET", "Python", "Angular", "Blazor", "PostgreSQL", "SQL Server", "Docker"],
    methodologies: ["Scrum", "Agile"],
    skills: ["Full Stack", "Integración de sistemas", "APIs REST"],
    featured: false
  },
  {
    company: "Everis",
    role: "Full-Stack Developer / Co-Líder Técnico",
    startDate: "2017-01-01",
    endDate: "2018-01-01",
    current: false,
    location: "Sevilla",
    modality: "not_specified",
    description:
      "Apoyo a la coordinación técnica del equipo en un proyecto internacional del sector turístico.",
    achievements: [],
    responsibilities: [
      "Contribución a decisiones técnicas y mejora del flujo de trabajo.",
      "Implementación de métricas de calidad de código.",
      "Revisiones funcionales de entregables.",
      "Planificación de releases y coordinación entre desarrollo, QA y negocio."
    ],
    technologies: ["C#", ".NET", "Angular", "SQL Server", "Docker", "SonarQube"],
    methodologies: ["Kanban", "Agile"],
    skills: ["Coordinación técnica", "QA", "Release planning"],
    featured: false
  },
  {
    company: "Consultoría y desarrollo",
    role: "Roles técnicos en consultoría y desarrollo",
    startDate: "2015-01-01",
    endDate: "2017-01-01",
    current: false,
    location: "Sevilla",
    modality: "not_specified",
    description:
      "Participación en proyectos de integración y modernización de aplicaciones con Java, .NET y AngularJS en sectores público y privado.",
    achievements: [],
    responsibilities: [
      "Desarrollo y mantenimiento de aplicaciones web.",
      "Consolidación de base técnica y evolución progresiva hacia roles de liderazgo y gestión IT."
    ],
    technologies: ["Java", ".NET", "AngularJS", "Oracle", "Spring", "Hibernate"],
    methodologies: ["Agile"],
    skills: ["Desarrollo software", "Modernización", "Integración"],
    featured: false
  }
];

export const abelEducation: EducationSeed[] = [
  {
    title: "ITIL® 4 Foundation",
    institution: "Idexa Formación",
    date: "2025",
    type: "certification",
    description: "Certificación incluida en el CV actual."
  },
  {
    title: "Iniciación al Desarrollo con IA",
    institution: "Big School",
    date: "2025",
    type: "course",
    description: "Curso incluido en el CV actual."
  },
  {
    title: "Scrum Foundation Professional Certificate",
    institution: "CertiProf",
    date: "2021",
    type: "certification",
    description: "Certificación Scrum incluida en CVs 2024, 2025 y 2026."
  },
  {
    title: "Agile Methodology with Kanban",
    institution: "Everis",
    date: "2020",
    type: "certification",
    description: "Formación/certificación en metodología ágil con Kanban."
  },
  {
    title: "CFGS Desarrollo de Aplicaciones Informáticas",
    institution: "Salesianas Mª Auxiliadora - Sevilla",
    date: "2013",
    type: "study",
    description: "Formación superior en desarrollo de aplicaciones."
  }
];

export const abelSkills: SkillSeed[] = [
  "Gestión de Proyectos IT",
  "Delivery Management",
  "Gestión Ágil (Scrum / Kanban)",
  "Gestión de Stakeholders",
  "KPIs y Reporting",
  "User Acceptance Testing (UAT)",
  "Comunicación con cliente"
].map((name) => ({ name, category: "Gestión de proyectos" })).concat([
  { name: ".NET", category: "Lenguajes y Frameworks" },
  { name: "C#", category: "Lenguajes y Frameworks" },
  { name: "Python", category: "Lenguajes y Frameworks" },
  { name: "Java", category: "Lenguajes y Frameworks" },
  { name: "Angular", category: "Lenguajes y Frameworks" },
  { name: "Blazor", category: "Lenguajes y Frameworks" },
  { name: "Xamarin", category: "Lenguajes y Frameworks" },
  { name: "SQL Server", category: "Bases de datos" },
  { name: "PostgreSQL", category: "Bases de datos" },
  { name: "Oracle", category: "Bases de datos" },
  { name: "Azure Cloud", category: "Cloud" },
  { name: "Amazon Web Services", category: "Cloud" },
  { name: "Docker", category: "DevOps" },
  { name: "Kubernetes", category: "DevOps" },
  { name: "AKS", category: "DevOps" },
  { name: "CI/CD", category: "DevOps" },
  { name: "GitHub", category: "Herramientas" },
  { name: "GitLab", category: "Herramientas" },
  { name: "XUnit", category: "Testing y Calidad" },
  { name: "NUnit", category: "Testing y Calidad" },
  { name: "Cypress", category: "Testing y Calidad" },
  { name: "SonarQube", category: "Testing y Calidad" },
  { name: "Postman", category: "Testing y Calidad" },
  { name: "Arquitectura Limpia", category: "Arquitectura y Diseño" },
  { name: "SOLID", category: "Arquitectura y Diseño" },
  { name: "DDD", category: "Arquitectura y Diseño" },
  { name: "APIs REST", category: "Arquitectura y Diseño" },
  { name: "Microservicios", category: "Arquitectura y Diseño" },
  { name: "Español nativo", category: "Idiomas" },
  { name: "Inglés B1", category: "Idiomas" }
]);

export const demoProjects: ProjectSeed[] = [
  {
    name: "Portfolio Platform",
    description:
      "Proyecto demo: plataforma modular de portfolio/CV con frontend Next.js, API NestJS, PostgreSQL, Prisma y CV Manager.",
    status: "published",
    category: "Demo / Portfolio",
    technologies: ["Next.js", "NestJS", "PostgreSQL", "Prisma", "Docker"],
    featured: true,
    sample: true
  },
  {
    name: "CV Role Adaptation Engine",
    description:
      "Proyecto demo: motor basado en reglas para adaptar versiones de CV a ofertas sin inventar datos profesionales.",
    status: "draft",
    category: "Demo / CV Manager",
    technologies: ["NestJS", "Zod", "DOCX", "PDF"],
    featured: false,
    sample: true
  }
];

export const cvSummary =
  "IT Project Manager con más de 6 años liderando proyectos IT en entornos enterprise, especializado en Delivery Management, gestión ágil, KPIs, UAT, relación con cliente, Cloud y DevOps.";
