"use client";

import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Download, ExternalLink, Languages, LockKeyhole, Mail, MapPinned } from "lucide-react";
import { portfolioClient } from "@/lib/api";
import { getAlternateLocalePath, type Locale, type PublicCopy } from "@/lib/i18n";

type CommandPaletteProps = {
  cvUrl: string;
  linkedin?: string;
  email: string;
  locale: Locale;
  copy: PublicCopy["command"];
};

export function CommandPalette({ cvUrl, linkedin, email, locale, copy }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }

      const nextSecret = `${secret}${event.key.toLowerCase()}`.slice(-5);
      setSecret(nextSecret);
      if (nextSecret.endsWith("admin")) {
        window.location.href = "/login";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [secret]);

  const go = (hash: string) => {
    setOpen(false);
    document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <button
        className="fixed bottom-5 right-5 z-40 rounded-md border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground shadow-lg transition hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        {copy.trigger}
      </button>
      <a className="fixed right-0 top-0 z-40 size-8" href="/login" aria-label={copy.hiddenAdminLabel} />
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={copy.placeholder} />
        <CommandList>
          <CommandEmpty>{copy.empty}</CommandEmpty>
          <CommandGroup heading={copy.navigation}>
            <CommandItem onSelect={() => go("#experience")}>
              <MapPinned data-icon="inline-start" />
              {copy.goExperience}
            </CommandItem>
            <CommandItem onSelect={() => go("#projects")}>
              <MapPinned data-icon="inline-start" />
              {copy.goProjects}
            </CommandItem>
            <CommandItem onSelect={() => go("#contact")}>
              <Mail data-icon="inline-start" />
              {copy.contact}
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={copy.actions}>
            <CommandItem
              onSelect={() => {
                portfolioClient.track("cv_download", "command_palette", locale === "en" ? "/en" : "/");
                window.open(cvUrl, "_blank");
              }}
            >
              <Download data-icon="inline-start" />
              {copy.downloadCv}
            </CommandItem>
            <CommandItem onSelect={() => (window.location.href = getAlternateLocalePath(locale))}>
              <Languages data-icon="inline-start" />
              {copy.switchLanguage}
            </CommandItem>
            <CommandItem onSelect={() => linkedin && window.open(linkedin, "_blank")}>
              <ExternalLink data-icon="inline-start" />
              {copy.openLinkedIn}
            </CommandItem>
            <CommandItem onSelect={() => (window.location.href = `mailto:${email}`)}>
              <Mail data-icon="inline-start" />
              {copy.email}
            </CommandItem>
            <CommandItem onSelect={() => (window.location.href = "/login")}>
              <LockKeyhole data-icon="inline-start" />
              {copy.admin}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
