import Link from "next/link";
import { EntityForm } from "@/components/admin/entity-form";
import { LinkedinSettings } from "@/components/admin/linkedin-settings";
import { MfaSettings } from "@/components/admin/mfa-settings";
import { WebhookSettings } from "@/components/admin/webhook-settings";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Configuracion" fields={["Idioma principal", "CORS frontend", "Email de contacto", "CTA principal"]} />
      <MfaSettings />
      <WebhookSettings />
      <LinkedinSettings />
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
      <Card>
        <CardHeader>
          <CardTitle>Traducciones</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>Edita copy publico por locale, namespace y clave desde backend.</p>
          <div>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/settings/translations">Gestionar traducciones</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
