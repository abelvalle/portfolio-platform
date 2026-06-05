import { DataTable } from "@/components/admin/data-table";
import { EntityForm } from "@/components/admin/entity-form";
import { portfolioFallback } from "@/lib/portfolio-data";

export default function ExperienceAdminPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Experiencia" fields={["Empresa", "Cargo", "Fecha inicio", "Fecha fin", "Descripción", "Logros", "Responsabilidades", "Tecnologías"]} />
      <DataTable rows={portfolioFallback.experiences.map((item) => ({ empresa: item.company, cargo: item.role, visible: true, destacado: item.featured }))} />
    </div>
  );
}
