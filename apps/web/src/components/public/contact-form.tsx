"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { portfolioClient } from "@/lib/api";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10)
});

export function ContactForm() {
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    const parsed = contactSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      toast.error("Revisa los campos del formulario.");
      return;
    }

    setLoading(true);
    try {
      await portfolioClient.sendContact(parsed.data);
      await portfolioClient.track("contact_submit", "landing_contact", "/");
      toast.success("Mensaje enviado. Gracias por contactar.");
    } catch {
      toast.error("No se pudo enviar el mensaje. Puedes escribir por email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" placeholder="Tu nombre" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" placeholder="tu@email.com" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subject">Asunto</Label>
        <Input id="subject" name="subject" placeholder="Oportunidad / proyecto / contacto" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Mensaje</Label>
        <Textarea id="message" name="message" placeholder="Cuéntame brevemente en qué puedo ayudar." required rows={6} />
      </div>
      <Button disabled={loading} type="submit" size="lg">
        <Send data-icon="inline-start" />
        {loading ? "Enviando..." : "Enviar mensaje"}
      </Button>
    </form>
  );
}
