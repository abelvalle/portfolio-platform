import { CvTemplatesPage } from "@/components/public/cv-templates-page";
import { cvClient, portfolioClient } from "@/lib/api";
import { cvTemplateFallbacks, normalizeCvTemplates } from "@/lib/cv-templates";

export default async function CvTemplatesRoute() {
  const [snapshot, templates] = await Promise.all([portfolioClient.snapshot("es"), getTemplates()]);
  const cvUrl = snapshot.profile.cvUrl || snapshot.cv.url;

  return <CvTemplatesPage templates={templates} locale="es" cvUrl={cvUrl} />;
}

async function getTemplates() {
  try {
    return normalizeCvTemplates(await cvClient.templates());
  } catch {
    return cvTemplateFallbacks;
  }
}
