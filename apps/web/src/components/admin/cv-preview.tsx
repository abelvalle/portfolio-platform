"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CvA4Preview } from "@/components/cv/cv-a4-preview";
import { cvClient, portfolioClient, type CvItem, type CvTemplateItem } from "@/lib/api";
import { portfolioFallback, type PortfolioSnapshot } from "@/lib/portfolio-data";

export function CvPreview() {
  const [cv, setCv] = useState<CvItem | null>(null);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(portfolioFallback);
  const [templates, setTemplates] = useState<CvTemplateItem[]>([]);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState("");
  const [message, setMessage] = useState("Cargando preview.");

  async function loadPreview() {
    try {
      const [nextCv, nextSnapshot, nextTemplates] = await Promise.all([
        cvClient.primary(),
        portfolioClient.snapshot("es"),
        cvClient.templates().catch(() => [])
      ]);
      setCv(nextCv);
      setSnapshot(nextSnapshot);
      setTemplates(nextTemplates.filter((template) => template.visible !== false));
      setSelectedTemplateSlug((current) => current || nextTemplates.find((template) => template.visible !== false)?.slug || "");
      setMessage("Preview sincronizado con la API.");
    } catch {
      setMessage("Preview usando datos fallback.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPreview();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const previewSnapshot: PortfolioSnapshot = {
    ...snapshot,
    profile: {
      ...snapshot.profile,
      headline: cv?.headline || snapshot.profile.headline
    },
    cv: {
      ...snapshot.cv,
      headline: cv?.headline || snapshot.cv.headline,
      summary: cv?.summary || snapshot.cv.summary
    }
  };
  const selectedTemplate = templates.find((template) => template.slug === selectedTemplateSlug);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa A4</CardTitle>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
        <div className="grid max-w-xs gap-2">
          <Label htmlFor="adminCvPreviewTemplate">Plantilla preview admin</Label>
          <select
            id="adminCvPreviewTemplate"
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
            value={selectedTemplateSlug}
            onChange={(event) => setSelectedTemplateSlug(event.target.value)}
          >
            <option value="">Preview base</option>
            {templates.map((template) => (
              <option key={template.slug} value={template.slug}>{template.name}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <CvA4Preview snapshot={previewSnapshot} template={selectedTemplate} locale="es" className="max-w-xl" />
      </CardContent>
    </Card>
  );
}
