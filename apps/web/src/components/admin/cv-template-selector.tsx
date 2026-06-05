import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const templates = ["Minimalista", "Ejecutiva", "Técnica", "ATS-friendly", "Una página", "Dos páginas"];

export function CvTemplateSelector() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <Card key={template}>
          <CardHeader>
            <CardTitle>{template}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Tipografía</Badge>
            <Badge variant="outline">Color</Badge>
            <Badge variant="outline">Densidad</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
