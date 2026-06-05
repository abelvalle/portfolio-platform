import Link from "next/link";
import { ContactForm } from "@/components/public/contact-form";
import { buttonVariants } from "@/components/ui/button";
import { portfolioClient } from "@/lib/api";
import { cn } from "@/lib/utils";

export default async function ContactPage() {
  const snapshot = await portfolioClient.snapshot();

  return (
    <main className="min-h-dvh bg-background px-6 py-16 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <p className="font-mono text-sm text-primary">Contacto</p>
          <h1 className="mt-3 text-5xl font-semibold">Construyamos algo juntos.</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{snapshot.profile.shortBio}</p>
          <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-8")} href="/">
            Volver al portfolio
          </Link>
        </section>
        <ContactForm />
      </div>
    </main>
  );
}
