import { EntityForm } from "@/components/admin/entity-form";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Configuración" fields={["Idioma principal", "CORS frontend", "Email de contacto", "CTA principal"]} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Seguridad admin</CardTitle>
            <Badge variant="secondary">MFA preparado</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>
            La API soporta configuración TOTP, confirmación, reto MFA en login y desactivación protegida. MFA no está
            activado por defecto para evitar bloquear el acceso inicial.
          </p>
          <DataTable rows={[
            { flujo: "Estado MFA", endpoint: "GET /api/v1/auth/mfa/status", estado: "protegido" },
            { flujo: "Setup TOTP", endpoint: "POST /api/v1/auth/mfa/setup", estado: "protegido" },
            { flujo: "Confirmar TOTP", endpoint: "POST /api/v1/auth/mfa/confirm", estado: "protegido" },
            { flujo: "Verificar login", endpoint: "POST /api/v1/auth/mfa/verify-login", estado: "rate limited" }
          ]} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Integración LinkedIn</CardTitle>
            <Badge variant="secondary">Opcional</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>
            La API expone estado, URL de autorización OAuth opcional y URL de compartir portfolio. Si no hay credenciales
            LinkedIn, la landing conserva el enlace público del perfil.
          </p>
          <DataTable rows={[
            { flujo: "Estado", endpoint: "GET /api/v1/integrations/linkedin/status", acceso: "público" },
            { flujo: "Auth URL", endpoint: "GET /api/v1/integrations/linkedin/auth-url", acceso: "admin" },
            { flujo: "Share URL", endpoint: "GET /api/v1/integrations/linkedin/share-url", acceso: "público" }
          ]} />
        </CardContent>
      </Card>
      <section id="modules">
        <DataTable rows={[
          { modulo: "Dashboard", activo: true },
          { modulo: "Portfolio", activo: true },
          { modulo: "CV Manager", activo: true },
          { modulo: "Módulos futuros", activo: true }
        ]} />
      </section>
    </div>
  );
}
