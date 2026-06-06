import { CvTemplatesPage } from "@/components/public/cv-templates-page";
import { getPublicCvTemplates } from "@/app/cv/templates/template-data";
import { portfolioClient } from "@/lib/api";

export default async function EnglishCvTemplatesRoute() {
  const [snapshot, templates] = await Promise.all([portfolioClient.snapshot("en"), getPublicCvTemplates()]);
  const cvUrl = snapshot.profile.cvUrl || snapshot.cv.url;

  return <CvTemplatesPage templates={templates} locale="en" cvUrl={cvUrl} theme={snapshot.theme} />;
}
