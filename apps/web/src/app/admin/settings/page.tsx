import { EntityForm } from "@/components/admin/entity-form";
import { DataTable } from "@/components/admin/data-table";

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Configuración" fields={["Idioma principal", "CORS frontend", "Email de contacto", "CTA principal"]} />
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
