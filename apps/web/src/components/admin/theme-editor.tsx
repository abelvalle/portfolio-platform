import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ThemeEditor() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader>
          <CardTitle>Editor visual de estilos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          {["Color principal", "Color secundario", "Color de fondo", "Color de texto", "Tipografía"].map((label) => (
            <div className="grid gap-2" key={label}>
              <Label>{label}</Label>
              <Input placeholder={label} />
            </div>
          ))}
          <div className="grid gap-2">
            <Label>Intensidad de animaciones</Label>
            <Input type="range" defaultValue={60} max={100} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Modo oscuro</Label>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-background p-6">
            <p className="font-mono text-xs text-primary">01 / Preview</p>
            <h3 className="mt-3 text-3xl font-semibold">Abel Valle Rosa</h3>
            <p className="mt-3 text-muted-foreground">IT Project Manager · Delivery Manager</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
