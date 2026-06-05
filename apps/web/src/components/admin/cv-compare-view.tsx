import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CvCompareView() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {["CV base", "CV adaptado"].map((title) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
            <p>Resumen profesional</p>
            <p>Orden de skills</p>
            <p>Experiencia destacada</p>
            <p>Orden de secciones</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
