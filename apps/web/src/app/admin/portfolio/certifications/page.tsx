import { DataTable } from "@/components/admin/data-table";
import { EntityForm } from "@/components/admin/entity-form";
import { portfolioFallback } from "@/lib/portfolio-data";

export default function CertificationsAdminPage() {
  return (
    <div className="grid gap-6">
      <EntityForm title="Certificaciones" fields={["Título", "Institución", "Fecha", "Descripción", "Archivo adjunto"]} />
      <DataTable rows={portfolioFallback.certifications.map((item) => ({ titulo: item.title, institucion: item.institution, fecha: item.date, visible: true }))} />
    </div>
  );
}
