import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, Mail, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getCvPath, type Locale, type PublicCopy } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";

export function HeroSection({
  snapshot,
  locale,
  copy
}: {
  snapshot: PortfolioSnapshot;
  locale: Locale;
  copy: PublicCopy["hero"];
}) {
  const { profile, cv } = snapshot;
  const cvUrl = profile.cvUrl || cv.url;

  return (
    <section className="relative flex min-h-dvh items-center px-6 py-24 sm:px-10 lg:px-16" id="top">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <MapPin data-icon="inline-start" />
              {profile.location}
            </span>
            <span className="max-w-full rounded-full bg-secondary px-3 py-1 text-xs font-medium leading-5 text-secondary-foreground">
              {profile.availability}
            </span>
          </div>
          <div className="flex flex-col gap-5">
            <h1 className="max-w-5xl text-6xl font-semibold leading-none text-balance sm:text-7xl lg:text-8xl">
              {profile.fullName}
            </h1>
            <p className="max-w-3xl text-2xl leading-9 text-foreground/90 sm:text-3xl">{profile.headline}</p>
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{profile.subtitle}</p>
          </div>
          <p className="max-w-2xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">{profile.shortBio}</p>
          <div className="flex flex-wrap gap-3">
            <a className={cn(buttonVariants({ size: "lg" }))} href={cvUrl} download>
              <Download data-icon="inline-start" />
              {copy.downloadCv}
            </a>
            <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }))} href={getCvPath(locale)}>
              {copy.viewCv}
            </Link>
            <Link className={cn(buttonVariants({ variant: "secondary", size: "lg" }))} href="#contact">
              {copy.contact}
            </Link>
            {profile.linkedin ? (
              <a className={cn(buttonVariants({ variant: "ghost", size: "lg" }))} href={profile.linkedin} target="_blank" rel="noreferrer">
                <ExternalLink data-icon="inline-start" />
                LinkedIn
              </a>
            ) : null}
            <a className={cn(buttonVariants({ variant: "ghost", size: "lg" }))} href={`mailto:${profile.email}`}>
              <Mail data-icon="inline-start" />
              {copy.email}
            </a>
          </div>
        </div>
        <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-border bg-card">
          <Image
            src="/media/abel-portrait-dark.png"
            alt={copy.portraitAlt}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 42vw, 100vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/50 to-transparent p-6">
            <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <span>Delivery</span>
              <span>KPIs</span>
              <span>UAT</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
