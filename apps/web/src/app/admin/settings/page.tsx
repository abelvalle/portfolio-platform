import { DataTable } from "@/components/admin/data-table";
import { EntityForm } from "@/components/admin/entity-form";
import { MfaSettings } from "@/components/admin/mfa-settings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Configuracion" fields={["Idioma principal", "CORS frontend", "Email de contacto", "CTA principal"]} />
      <MfaSettings />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Integracion LinkedIn</CardTitle>
            <Badge variant="secondary">Opcional</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>
            La API expone estado, URL de autorizacion OAuth opcional y URL de compartir portfolio. Si no hay credenciales
            LinkedIn, la landing conserva el enlace publico del perfil.
          </p>
          <DataTable rows={[
            { flujo: "Estado", endpoint: "GET /api/v1/integrations/linkedin/status", acceso: "publico" },
            { flujo: "Auth URL", endpoint: "GET /api/v1/integrations/linkedin/auth-url", acceso: "admin" },
            { flujo: "Share URL", endpoint: "GET /api/v1/integrations/linkedin/share-url", acceso: "publico" }
          ]} />
        </CardContent>
      </Card>
      <section id="modules">
        <DataTable rows={[
          { modulo: "Dashboard", activo: true },
          { modulo: "Portfolio", activo: true },
          { modulo: "CV Manager", activo: true },
          { modulo: "Modulos futuros", activo: true }
        ]} />
      </section>
    </div>
  );
}
