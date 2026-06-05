import { DataTable } from "./data-table";

export function CvVersionTable() {
  return (
    <DataTable
      rows={[
        { nombre: "CV general", objetivo: "IT Project Manager", estado: "publicado", idioma: "ES", principal: true },
        { nombre: "Delivery Manager", objetivo: "Delivery Manager", estado: "borrador", idioma: "ES", principal: false },
        { nombre: "Cloud / DevOps", objetivo: "Cloud oriented roles", estado: "borrador", idioma: "ES", principal: false }
      ]}
    />
  );
}
