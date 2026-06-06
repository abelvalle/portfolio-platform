"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa A4</CardTitle>
        <p className="text-sm text-muted-foreground" aria-live="polite">{message}</p>
      </CardHeader>
      <CardContent>
        <div className="mx-auto aspect-[210/297] max-w-xl rounded-sm bg-white p-8 text-slate-950 shadow-2xl">
          <h2 className="text-3xl font-bold">{snapshot.profile.fullName}</h2>
          <p className="mt-2 text-sm text-slate-600">{cv?.headline || snapshot.profile.headline}</p>
          <p className="mt-6 text-sm leading-6">{cv?.summary || snapshot.cv.summary}</p>
          <h3 className="mt-8 border-t border-slate-300 pt-4 font-semibold">Experiencia</h3>
          {snapshot.experiences.slice(0, 3).map((experience) => (
            <div key={`${experience.company}-${experience.role}`} className="mt-4">
              <p className="font-semibold">{experience.role}</p>
              <p className="text-sm text-slate-600">{experience.company}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
