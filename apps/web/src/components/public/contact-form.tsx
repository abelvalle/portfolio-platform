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
import type { PublicCopy } from "@/lib/i18n";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10)
});

export function ContactForm({ copy, trackingPath = "/" }: { copy: PublicCopy["contact"]["form"]; trackingPath?: string }) {
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    const parsed = contactSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      toast.error(copy.validationError);
      return;
    }

    setLoading(true);
    try {
      await portfolioClient.sendContact(parsed.data);
      await portfolioClient.track("contact_submit", "landing_contact", trackingPath);
      toast.success(copy.success);
    } catch {
      toast.error(copy.submitError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{copy.name}</Label>
        <Input id="name" name="name" placeholder={copy.namePlaceholder} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{copy.email}</Label>
        <Input id="email" name="email" placeholder={copy.emailPlaceholder} type="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subject">{copy.subject}</Label>
        <Input id="subject" name="subject" placeholder={copy.subjectPlaceholder} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">{copy.message}</Label>
        <Textarea id="message" name="message" placeholder={copy.messagePlaceholder} required rows={6} />
      </div>
      <Button disabled={loading} type="submit" size="lg">
        <Send data-icon="inline-start" />
        {loading ? copy.sending : copy.submit}
      </Button>
    </form>
  );
}
