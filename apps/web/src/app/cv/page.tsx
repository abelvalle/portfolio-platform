import Link from "next/link";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { portfolioClient } from "@/lib/api";
import { cn } from "@/lib/utils";

export default async function CvPage() {
  const snapshot = await portfolioClient.snapshot();
  const cvUrl = snapshot.profile.cvUrl || snapshot.cv.url;

  return (
    <main className="min-h-dvh bg-background px-6 py-12 text-foreground sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-border bg-card p-8">
          <p className="font-mono text-sm text-primary">CV online</p>
          <h1 className="mt-3 text-5xl font-semibold">{snapshot.profile.fullName}</h1>
          <p className="mt-4 text-xl text-muted-foreground">{snapshot.profile.headline}</p>
          <p className="mt-8 text-lg leading-8">{snapshot.cv.summary}</p>
          <div className="mt-10 flex flex-col gap-8">
            {snapshot.experiences.map((experience) => (
              <article key={experience.company} className="border-t border-border pt-6">
                <h2 className="text-2xl font-semibold">{experience.role}</h2>
                <p className="text-muted-foreground">{experience.company}</p>
                <p className="mt-4 leading-7 text-muted-foreground">{experience.description}</p>
              </article>
            ))}
          </div>
        </section>
        <aside className="flex flex-col gap-4">
          <a className={cn(buttonVariants({ size: "lg" }))} href={cvUrl} download>
            <Download data-icon="inline-start" />
            Descargar CV
          </a>
          <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href="/">
            Volver al portfolio
          </Link>
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>{snapshot.profile.email}</span>
              <span>{snapshot.profile.phone}</span>
              <span>{snapshot.profile.location}</span>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
