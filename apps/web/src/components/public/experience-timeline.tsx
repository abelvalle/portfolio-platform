import { Badge } from "@/components/ui/badge";
import type { PublicCopy } from "@/lib/i18n";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";

export function ExperienceTimeline({
  experiences,
  copy
}: {
  experiences: PortfolioSnapshot["experiences"];
  copy: PublicCopy["experience"];
}) {
  return (
    <div className="flex flex-col gap-10">
      {experiences.map((experience, index) => (
        <article key={`${experience.company}-${experience.role}`} className="grid gap-5 border-t border-border pt-8 lg:grid-cols-[160px_1fr]">
          <div className="font-mono text-sm text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
            <div className="mt-2 text-xs">
              {experience.startDate.slice(0, 4)} - {experience.current ? copy.current : experience.endDate?.slice(0, 4)}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-2xl font-semibold">{experience.role}</h3>
              <p className="text-muted-foreground">{experience.company} · {experience.location}</p>
            </div>
            <p className="max-w-3xl leading-8 text-muted-foreground">{experience.description}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {experience.responsibilities.slice(0, 4).map((item) => (
                <p key={item} className="border-l border-primary/60 pl-4 text-sm leading-6 text-foreground/85">{item}</p>
              ))}
            </div>
            {experience.achievements.length ? (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{copy.results}</p>
                {experience.achievements.map((item) => <p key={item} className="text-sm text-muted-foreground">{item}</p>)}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {[...experience.methodologies, ...experience.technologies].slice(0, 12).map((item) => (
                <Badge key={item} variant="outline">{item}</Badge>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
