"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { sections } from "@/lib/portfolio-data";

export function SectionNavigation() {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const onScroll = () => {
      const visible = sections.findLast((section) => {
        const element = document.getElementById(section.id);
        return element ? element.getBoundingClientRect().top <= 180 : false;
      });
      if (visible) setActive(visible.id);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 xl:flex" aria-label="Secciones">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={cn(
            "group flex items-center gap-3 font-mono text-xs text-muted-foreground transition-colors",
            active === section.id && "text-foreground"
          )}
        >
          <span className="w-7">{section.number}</span>
          <span
            className={cn(
              "h-px w-8 bg-border transition-all group-hover:w-12 group-hover:bg-primary",
              active === section.id && "w-14 bg-primary"
            )}
          />
          <span className="opacity-0 transition-opacity group-hover:opacity-100">{section.label}</span>
        </a>
      ))}
    </nav>
  );
}
