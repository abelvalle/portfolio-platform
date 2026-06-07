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
import { getPortfolioPath, type Locale, type PublicCopy } from "@/lib/i18n";
import type { PortfolioSnapshot } from "@/lib/portfolio-data";
import { buildPublicThemeStyle } from "@/lib/public-theme";

export function PublicLanding({ snapshot, locale, copy }: { snapshot: PortfolioSnapshot; locale: Locale; copy: PublicCopy }) {
  const [introVisible, setIntroVisible] = useState(true);
  const trackingPath = getPortfolioPath(locale);
  const themeStyle = buildPublicThemeStyle(snapshot.theme);

  useEffect(() => {
    portfolioClient.track("landing_visit", "home", trackingPath);
  }, [trackingPath]);

  const cvUrl = snapshot.profile.cvUrl || snapshot.cv.url;

  return (
    <main className="min-h-dvh bg-background text-foreground" style={themeStyle}>
      <AnimatePresence>
        {introVisible ? (
          <IntroScreen
            name={snapshot.profile.fullName}
            subtitle={snapshot.profile.subtitle}
            label={copy.intro.label}
            enterLabel={copy.intro.enter}
            skipLabel={copy.intro.skip}
            onEnter={() => setIntroVisible(false)}
          />
        ) : null}
      </AnimatePresence>
      <SectionNavigation sections={copy.sections} ariaLabel={copy.ariaSections} />
      <CommandPalette cvUrl={cvUrl} linkedin={snapshot.profile.linkedin} email={snapshot.profile.email} locale={locale} copy={copy.command} />
      <HeroSection snapshot={snapshot} locale={locale} copy={copy.hero} />
      <div className="mx-auto flex max-w-7xl flex-col gap-28 px-6 py-20 sm:px-10 lg:px-16">
        <NumberedSection id="about" number="01" title={copy.sections[0].label} sections={copy.sections}>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <p className="text-3xl font-semibold leading-tight text-balance">{snapshot.profile.shortBio}</p>
            <div className="flex flex-col gap-6 text-lg leading-9 text-muted-foreground">
              <p>{snapshot.profile.longBio}</p>
              <p className="border-l border-primary pl-5 text-foreground">{copy.about.highlight}</p>
            </div>
          </div>
        </NumberedSection>

        <NumberedSection id="experience" number="02" title={copy.sections[1].label} sections={copy.sections}>
          <ExperienceTimeline experiences={snapshot.experiences} copy={copy.experience} />
        </NumberedSection>

        <NumberedSection id="projects" number="03" title={copy.sections[2].label} sections={copy.sections}>
          <div className="grid gap-5 md:grid-cols-2">
            {snapshot.projects.map((project) => <ProjectCard key={project.name} project={project} copy={copy.projects} />)}
          </div>
        </NumberedSection>

        <NumberedSection id="education" number="04" title={copy.sections[3].label} sections={copy.sections}>
          <EducationTimeline education={snapshot.education} certifications={snapshot.certifications} typeLabels={copy.education.typeLabels} />
        </NumberedSection>

        <NumberedSection id="skills" number="05" title={copy.sections[4].label} sections={copy.sections}>
          <SkillsGrid skills={snapshot.skills} />
        </NumberedSection>

        <NumberedSection id="contact" number="06" title={copy.sections[5].label} sections={copy.sections}>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="flex flex-col gap-5">
              <p className="text-3xl font-semibold leading-tight">{copy.contact.title}</p>
              <a className="text-muted-foreground hover:text-foreground" href={`mailto:${snapshot.profile.email}`}>{snapshot.profile.email}</a>
              {snapshot.profile.linkedin ? <a className="text-muted-foreground hover:text-foreground" href={snapshot.profile.linkedin}>LinkedIn</a> : null}
              {snapshot.profile.phone ? <p className="text-muted-foreground">{snapshot.profile.phone}</p> : null}
            </div>
            <ContactForm copy={copy.contact.form} trackingPath={trackingPath} />
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
  sections,
  children
}: {
  id: string;
  number: string;
  title: string;
  sections: { id: string; label: string; number: string }[];
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
