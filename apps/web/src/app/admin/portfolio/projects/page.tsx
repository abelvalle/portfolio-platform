import { DataTable } from "@/components/admin/data-table";
import { EntityForm } from "@/components/admin/entity-form";
import { portfolioFallback } from "@/lib/portfolio-data";

export default function ProjectsAdminPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Proyecto" fields={["Nombre", "Descripción", "Estado", "Categoría", "Tecnologías", "URL pública", "URL repositorio"]} />
      <DataTable rows={portfolioFallback.projects.map((item) => ({ nombre: item.name, categoria: item.category, estado: item.status, destacado: item.featured, demo: item.sample }))} />
    </div>
  );
}
