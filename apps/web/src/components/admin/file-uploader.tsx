import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FileUploader() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-6">
      <div className="flex flex-col gap-4">
        <Upload />
        <div>
          <h2 className="text-xl font-semibold">Subir CV manual</h2>
          <p className="mt-2 text-sm text-muted-foreground">PDF, DOCX o imagen de vista previa opcional.</p>
        </div>
        <Input type="file" accept=".pdf,.docx,image/*" />
        <Button type="button">Guardar archivo</Button>
      </div>
    </div>
  );
}
