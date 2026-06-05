import { Badge } from "@/components/ui/badge";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";

export function SkillsGrid({ skills }: { skills: PortfolioSnapshot["skills"] }) {
  const grouped = skills.reduce<Record<string, string[]>>((acc, skill) => {
    acc[skill.category] ||= [];
    acc[skill.category].push(skill.name);
    return acc;
  }, {});

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(grouped).map(([category, names]) => (
        <section key={category} className="rounded-lg border border-border bg-card/50 p-5">
          <h3 className="mb-4 text-lg font-semibold">{category}</h3>
          <div className="flex flex-wrap gap-2">
            {names.map((name) => <Badge key={name} variant="outline">{name}</Badge>)}
          </div>
        </section>
      ))}
    </div>
  );
}
