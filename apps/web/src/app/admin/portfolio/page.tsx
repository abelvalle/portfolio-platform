import { EntityForm } from "@/components/admin/entity-form";

export default function PortfolioPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <EntityForm title="Contenido principal" fields={["Nombre", "Titular profesional", "Subtítulo", "Bio corta", "Bio larga", "Ubicación"]} />
      <EntityForm title="Contacto y SEO" fields={["Email", "Teléfono", "LinkedIn", "GitHub", "Metadata SEO", "Open Graph image"]} />
    </div>
  );
}
