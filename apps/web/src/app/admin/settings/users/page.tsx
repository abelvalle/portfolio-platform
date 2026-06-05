import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roles = [
  {
    rol: "admin",
    permisos: "Usuarios, configuración, portfolio, CV, mensajes, analítica",
    alcance: "Control total"
  },
  {
    rol: "editor",
    permisos: "Portfolio, CV, mensajes, analítica",
    alcance: "Contenido"
  },
  {
    rol: "viewer",
    permisos: "Dashboard, portfolio, CV, analítica",
    alcance: "Lectura"
  }
];

export default function UsersSettingsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Usuarios y permisos</CardTitle>
            <Badge variant="secondary">API admin-only</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <DataTable rows={roles} />
        </CardContent>
      </Card>
    </div>
  );
}
