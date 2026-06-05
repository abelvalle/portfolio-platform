import { DataTable } from "@/components/admin/data-table";
import { EntityForm } from "@/components/admin/entity-form";
import { portfolioFallback } from "@/lib/portfolio-data";

export default function SkillsAdminPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Skill" fields={["Nombre", "Categoría", "Nivel opcional", "Orden"]} />
      <DataTable rows={portfolioFallback.skills.slice(0, 20).map((item) => ({ nombre: item.name, categoria: item.category, visible: true }))} />
    </div>
  );
}
