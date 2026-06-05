import { DataTable } from "@/components/admin/data-table";
import { EntityForm } from "@/components/admin/entity-form";
import { portfolioFallback } from "@/lib/portfolio-data";

export default function EducationAdminPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Estudios" fields={["Título", "Institución", "Fecha", "Descripción", "URL certificado"]} />
      <DataTable rows={portfolioFallback.education.map((item) => ({ titulo: item.title, institucion: item.institution, fecha: item.date, visible: true }))} />
    </div>
  );
}
