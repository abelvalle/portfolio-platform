import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioFallback } from "@/lib/portfolio-data";

export function CvPreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vista previa A4</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mx-auto aspect-[210/297] max-w-xl rounded-sm bg-white p-8 text-slate-950 shadow-2xl">
          <h2 className="text-3xl font-bold">{portfolioFallback.profile.fullName}</h2>
          <p className="mt-2 text-sm text-slate-600">{portfolioFallback.profile.headline}</p>
          <p className="mt-6 text-sm leading-6">{portfolioFallback.cv.summary}</p>
          <h3 className="mt-8 border-t border-slate-300 pt-4 font-semibold">Experiencia</h3>
          {portfolioFallback.experiences.slice(0, 3).map((experience) => (
            <div key={experience.company} className="mt-4">
              <p className="font-semibold">{experience.role}</p>
              <p className="text-sm text-slate-600">{experience.company}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
