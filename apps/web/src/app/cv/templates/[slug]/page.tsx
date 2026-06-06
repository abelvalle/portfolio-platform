import { notFound } from "next/navigation";
import { CvTemplatePreviewPage } from "@/components/public/cv-template-preview-page";
import { getPublicCvDownloadUrl, portfolioClient } from "@/lib/api";
import { findPublicCvTemplate, getPublicCvTemplates } from "../template-data";

export default async function CvTemplateRoute({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, snapshot, templates] = await Promise.all([
    params,
    portfolioClient.snapshot("es"),
    getPublicCvTemplates()
  ]);
  const template = findPublicCvTemplate(templates, slug);

  if (!template) {
    notFound();
  }

  const cvUrl = getPublicCvDownloadUrl(template.slug);
  return <CvTemplatePreviewPage template={template} snapshot={snapshot} locale="es" cvUrl={cvUrl} />;
}
