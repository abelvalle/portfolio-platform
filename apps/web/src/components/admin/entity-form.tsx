import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function EntityForm({ title, fields }: { title: string; fields: string[] }) {
  return (
    <form className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      {fields.map((field) => (
        <div className="grid gap-2" key={field}>
          <Label htmlFor={field}>{field}</Label>
          {field.toLowerCase().includes("descripción") || field.toLowerCase().includes("bio") ? (
            <Textarea id={field} placeholder={field} rows={4} />
          ) : (
            <Input id={field} placeholder={field} />
          )}
        </div>
      ))}
      <Button type="button">Guardar borrador</Button>
    </form>
  );
}
