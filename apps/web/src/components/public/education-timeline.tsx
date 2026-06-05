import { Badge } from "@/components/ui/badge";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";

export function EducationTimeline({
  education,
  certifications
}: {
  education: PortfolioSnapshot["education"];
  certifications: PortfolioSnapshot["certifications"];
}) {
  const items = [...education, ...certifications];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <article key={`${item.title}-${item.date}`} className="rounded-lg border border-border bg-card/60 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Badge variant={item.type === "study" ? "default" : "secondary"}>{item.type}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{item.date}</span>
          </div>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{item.institution}</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
