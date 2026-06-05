import { EntityForm } from "./entity-form";

export function CvEditor() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <EntityForm title="Información personal" fields={["Nombre", "Titular profesional", "Email", "LinkedIn", "Ubicación"]} />
      <EntityForm title="Resumen y bloques" fields={["Resumen profesional", "Experiencia", "Educación", "Certificaciones", "Skills"]} />
    </div>
  );
}
