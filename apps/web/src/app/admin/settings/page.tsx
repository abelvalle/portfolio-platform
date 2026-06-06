import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { EntityForm } from "@/components/admin/entity-form";
import { MfaSettings } from "@/components/admin/mfa-settings";
import { WebhookSettings } from "@/components/admin/webhook-settings";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Configuracion" fields={["Idioma principal", "CORS frontend", "Email de contacto", "CTA principal"]} />
      <MfaSettings />
      <WebhookSettings />
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
            { flujo: "Callback", endpoint: "GET /api/v1/integrations/linkedin/callback", acceso: "admin" },
            { flujo: "Share URL", endpoint: "GET /api/v1/integrations/linkedin/share-url", acceso: "publico" }
          ]} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Modulos de la plataforma</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>Activa, desactiva y ordena los modulos disponibles del panel desde una pantalla dedicada.</p>
          <div>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/settings/modules">Gestionar modulos</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
