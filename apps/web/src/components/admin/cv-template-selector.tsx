import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const templates = [
  { name: "Minimalista", features: ["Tipografía", "Color", "Densidad"] },
  { name: "Ejecutiva", features: ["Logros", "Foto opcional", "Color"] },
  { name: "Técnica", features: ["Skills", "Stack", "Proyectos"] },
  { name: "ATS-friendly", features: ["Texto plano", "Score ATS", "PDF/DOCX ATS"] },
  { name: "Una página", features: ["Compacta", "Prioridades", "Rol objetivo"] },
  { name: "Dos páginas", features: ["Completa", "Contexto", "Secciones"] }
];

export function CvTemplateSelector() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.name}>
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {template.features.map((feature) => (
              <Badge key={feature} variant={template.name === "ATS-friendly" ? "default" : "outline"}>{feature}</Badge>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
