"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { ContactForm } from "./contact-form";
import { EducationTimeline } from "./education-timeline";
import { ExperienceTimeline } from "./experience-timeline";
import { HeroSection } from "./hero-section";
import { IntroScreen } from "./intro-screen";
import { ProjectCard } from "./project-card";
import { SectionNavigation } from "./section-navigation";
import { SkillsGrid } from "./skills-grid";
import { portfolioClient } from "@/lib/api";
import { sections, type PortfolioSnapshot } from "@/lib/portfolio-data";

export function PublicLanding({ snapshot }: { snapshot: PortfolioSnapshot }) {
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    portfolioClient.track("landing_visit", "home", "/");
  }, []);

  const cvUrl = snapshot.profile.cvUrl || snapshot.cv.url;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <AnimatePresence>
        {introVisible ? (
          <IntroScreen name={snapshot.profile.fullName} subtitle={snapshot.profile.subtitle} onEnter={() => setIntroVisible(false)} />
        ) : null}
      </AnimatePresence>
      <SectionNavigation />
      <CommandPalette cvUrl={cvUrl} linkedin={snapshot.profile.linkedin} email={snapshot.profile.email} />
      <HeroSection snapshot={snapshot} />
      <div className="mx-auto flex max-w-7xl flex-col gap-28 px-6 py-20 sm:px-10 lg:px-16">
        <NumberedSection id="about" number="01" title="Sobre mí">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <p className="text-3xl font-semibold leading-tight text-balance">{snapshot.profile.shortBio}</p>
            <div className="flex flex-col gap-6 text-lg leading-9 text-muted-foreground">
              <p>{snapshot.profile.longBio}</p>
              <p className="border-l border-primary pl-5 text-foreground">
                Gestión IT, delivery, cliente, KPIs y UAT como hilo conductor entre negocio y equipos técnicos.
              </p>
            </div>
          </div>
        </NumberedSection>

        <NumberedSection id="experience" number="02" title="Experiencia">
          <ExperienceTimeline experiences={snapshot.experiences} />
        </NumberedSection>

        <NumberedSection id="projects" number="03" title="Proyectos">
          <div className="grid gap-5 md:grid-cols-2">
            {snapshot.projects.map((project) => <ProjectCard key={project.name} project={project} />)}
          </div>
        </NumberedSection>

        <NumberedSection id="education" number="04" title="Estudios y certificaciones">
          <EducationTimeline education={snapshot.education} certifications={snapshot.certifications} />
        </NumberedSection>

        <NumberedSection id="skills" number="05" title="Skills">
          <SkillsGrid skills={snapshot.skills} />
        </NumberedSection>

        <NumberedSection id="contact" number="06" title="Contacto">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col gap-5">
              <p className="text-3xl font-semibold leading-tight">Construyamos algo juntos.</p>
              <a className="text-muted-foreground hover:text-foreground" href={`mailto:${snapshot.profile.email}`}>{snapshot.profile.email}</a>
              {snapshot.profile.linkedin ? <a className="text-muted-foreground hover:text-foreground" href={snapshot.profile.linkedin}>LinkedIn</a> : null}
              {snapshot.profile.phone ? <p className="text-muted-foreground">{snapshot.profile.phone}</p> : null}
            </div>
            <ContactForm />
          </div>
        </NumberedSection>
      </div>
    </main>
  );
}

function NumberedSection({
  id,
  number,
  title,
  children
}: {
  id: string;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      className="scroll-mt-24"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-120px" }}
      transition={{ duration: 0.45 }}
    >
      <div className="mb-10 flex items-end justify-between gap-6 border-b border-border pb-5">
        <div>
          <p className="font-mono text-sm text-primary">{number} /</p>
          <h2 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">{title}</h2>
        </div>
        <p className="hidden font-mono text-xs text-muted-foreground md:block">
          {sections.find((section) => section.id === id)?.label}
        </p>
      </div>
      {children}
    </motion.section>
  );
}
