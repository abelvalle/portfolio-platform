"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CvA4Preview } from "@/components/cv/cv-a4-preview";
import { cvClient, portfolioClient, type CvItem } from "@/lib/api";
import { portfolioFallback, type PortfolioSnapshot } from "@/lib/portfolio-data";

export function CvPreview() {
  const [cv, setCv] = useState<CvItem | null>(null);
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(portfolioFallback);
  const [message, setMessage] = useState("Cargando preview.");

  async function loadPreview() {
    try {
      const [nextCv, nextSnapshot] = await Promise.all([
        cvClient.primary(),
        portfolioClient.snapshot("es")
      ]);
      setCv(nextCv);
      setSnapshot(nextSnapshot);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa A4</CardTitle>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </CardHeader>
      <CardContent>
        <CvA4Preview snapshot={previewSnapshot} locale="es" className="max-w-xl" />
      </CardContent>
    </Card>
  );
}
