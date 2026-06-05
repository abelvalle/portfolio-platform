import { CvTemplatesPage } from "@/components/public/cv-templates-page";
import { cvClient, portfolioClient } from "@/lib/api";
import { cvTemplateFallbacks, normalizeCvTemplates } from "@/lib/cv-templates";

export default async function EnglishCvTemplatesRoute() {
  const [snapshot, templates] = await Promise.all([portfolioClient.snapshot("en"), getTemplates()]);
  const cvUrl = snapshot.profile.cvUrl || snapshot.cv.url;

  return <CvTemplatesPage templates={templates} locale="en" cvUrl={cvUrl} />;
}

async function getTemplates() {
  try {
    return normalizeCvTemplates(await cvClient.templates());
  } catch {
    return cvTemplateFallbacks;
  }
}
