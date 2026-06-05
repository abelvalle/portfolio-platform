import { DashboardCards } from "@/components/admin/dashboard-cards";
import { DataTable } from "@/components/admin/data-table";

export default function AnalyticsPage() {
  return (
    <div className="grid gap-6">
      <DashboardCards />
      <DataTable rows={[{ evento: "landing_visit", ruta: "/", etiqueta: "home", fecha: "pendiente" }]} />
    </div>
  );
}
