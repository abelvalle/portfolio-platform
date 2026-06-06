import { CvTemplatesPage } from "@/components/public/cv-templates-page";
import { getPublicCvDownloadUrl, portfolioClient } from "@/lib/api";
import { getPublicCvTemplates } from "./template-data";

export default async function CvTemplatesRoute() {
  const [snapshot, templates] = await Promise.all([portfolioClient.snapshot("es"), getPublicCvTemplates()]);
  const cvUrl = getPublicCvDownloadUrl();

  return <CvTemplatesPage templates={templates} locale="es" cvUrl={cvUrl} theme={snapshot.theme} />;
}
