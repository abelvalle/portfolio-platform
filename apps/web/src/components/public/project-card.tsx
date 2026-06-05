import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicCopy } from "@/lib/i18n";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";

type Project = PortfolioSnapshot["projects"][number];

export function ProjectCard({ project, copy }: { project: Project; copy: PublicCopy["projects"] }) {
  return (
    <Card className="bg-card/70">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>{project.name}</CardTitle>
          {project.sample ? <Badge variant="secondary">{copy.sample}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="leading-7 text-muted-foreground">{project.description}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {project.technologies.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}
        </div>
        <ExternalLink className="text-muted-foreground" aria-hidden />
      </CardFooter>
    </Card>
  );
}
