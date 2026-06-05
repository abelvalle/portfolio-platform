import {
  abelEducation,
  abelExperiences,
  abelProfile,
  abelSkills,
  cvSummary,
  demoProjects
} from "@portfolio-platform/shared";

export const portfolioFallback = {
  profile: {
    ...abelProfile,
    avatarUrl: "/media/abel-portrait-dark.png",
    cvUrl: "/media/Abel_Valle_Rosa_CV_ES.pdf"
  },
  theme: {
    primaryColor: "#5eead4",
    secondaryColor: "#94a3b8",
    backgroundColor: "#07090d",
    textColor: "#f8fafc",
    borderRadius: "8px"
  },
  experiences: abelExperiences,
  education: abelEducation.filter((item) => item.type === "study"),
  certifications: abelEducation.filter((item) => item.type !== "study"),
  skills: abelSkills,
  projects: demoProjects,
  cv: {
    slug: "abel-valle-rosa-cv-general",
    name: "CV General Abel Valle Rosa",
    headline: abelProfile.headline,
    summary: cvSummary,
    url: "/media/Abel_Valle_Rosa_CV_ES.pdf"
  }
};

export type PortfolioSnapshot = typeof portfolioFallback;

export const sections = [
  { id: "about", label: "Sobre mí", number: "01" },
  { id: "experience", label: "Experiencia", number: "02" },
  { id: "projects", label: "Proyectos", number: "03" },
  { id: "education", label: "Estudios", number: "04" },
  { id: "skills", label: "Skills", number: "05" },
  { id: "contact", label: "Contacto", number: "06" }
];
