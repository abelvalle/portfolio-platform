import { cvClient } from "@/lib/api";
import { cvTemplateFallbacks, normalizeCvTemplates, type CvTemplateItem } from "@/lib/cv-templates";

export async function getPublicCvTemplates(): Promise<CvTemplateItem[]> {
  try {
    return normalizeCvTemplates(await cvClient.templates());
  } catch {
    return cvTemplateFallbacks;
  }
}

export function findPublicCvTemplate(templates: CvTemplateItem[], slug: string) {
  return templates.find((template) => template.slug === slug);
}
