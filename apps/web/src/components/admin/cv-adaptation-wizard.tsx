"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CvAdaptationWizard() {
  const [resultVisible, setResultVisible] = useState(false);
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <form className="grid gap-4 rounded-lg border border-border bg-card p-5">
        <div className="grid gap-2">
          <Label>Puesto objetivo</Label>
          <Input placeholder="Delivery Manager" />
        </div>
        <div className="grid gap-2">
          <Label>Empresa objetivo opcional</Label>
          <Input placeholder="Empresa" />
        </div>
        <div className="grid gap-2">
          <Label>Descripción de oferta</Label>
          <Textarea rows={12} placeholder="Pega aquí la oferta laboral." />
        </div>
        <Button type="button" onClick={() => setResultVisible(true)}>
          <WandSparkles data-icon="inline-start" />
          Proponer adaptación
        </Button>
      </form>
      <aside className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">Sugerencias pendientes</h2>
        {resultVisible ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Reordenar skills por delivery, UAT, KPIs y stakeholders.</p>
            <p>Priorizar Experis y Avanade por gestión y cliente.</p>
            <p>Resumen orientado al puesto, pendiente de revisión humana.</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">La propuesta aparecerá aquí antes de crear una nueva versión.</p>
        )}
      </aside>
    </div>
  );
}
