import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const cards = [
  ["Visitas landing", "0"],
  ["Proyectos publicados", "1"],
  ["Experiencias visibles", "5"],
  ["Mensajes recibidos", "0"],
  ["CV principal activo", "CV general"],
  ["Última actualización CV", "Seed inicial"]
];

export function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, value]) => (
        <Card key={label}>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
