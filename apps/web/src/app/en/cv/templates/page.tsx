import { CvTemplatesPage } from "@/components/public/cv-templates-page";
import { getPublicCvTemplates } from "@/app/cv/templates/template-data";
import { getPublicCvDownloadUrl, portfolioClient } from "@/lib/api";

export default async function EnglishCvTemplatesRoute() {
  const [snapshot, templates] = await Promise.all([portfolioClient.snapshot("en"), getPublicCvTemplates()]);
  const cvUrl = getPublicCvDownloadUrl();

  return <CvTemplatesPage templates={templates} locale="en" cvUrl={cvUrl} theme={snapshot.theme} />;
}
