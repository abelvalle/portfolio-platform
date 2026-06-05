"use client";

import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Download, ExternalLink, LockKeyhole, Mail, MapPinned } from "lucide-react";
import { portfolioClient } from "@/lib/api";

type CommandPaletteProps = {
  cvUrl: string;
  linkedin?: string;
  email: string;
};

export function CommandPalette({ cvUrl, linkedin, email }: CommandPaletteProps) {
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
        Ctrl K
      </button>
      <a className="fixed right-0 top-0 z-40 size-8" href="/login" aria-label="Acceso admin oculto" />
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar accion..." />
        <CommandList>
          <CommandEmpty>No hay acciones.</CommandEmpty>
          <CommandGroup heading="Navegación">
            <CommandItem onSelect={() => go("#experience")}>
              <MapPinned data-icon="inline-start" />
              Ir a experiencia
            </CommandItem>
            <CommandItem onSelect={() => go("#projects")}>
              <MapPinned data-icon="inline-start" />
              Ir a proyectos
            </CommandItem>
            <CommandItem onSelect={() => go("#contact")}>
              <Mail data-icon="inline-start" />
              Contactar
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Acciones">
            <CommandItem
              onSelect={() => {
                portfolioClient.track("cv_download", "command_palette", "/");
                window.open(cvUrl, "_blank");
              }}
            >
              <Download data-icon="inline-start" />
              Descargar CV
            </CommandItem>
            <CommandItem onSelect={() => linkedin && window.open(linkedin, "_blank")}>
              <ExternalLink data-icon="inline-start" />
              Abrir LinkedIn
            </CommandItem>
            <CommandItem onSelect={() => (window.location.href = `mailto:${email}`)}>
              <Mail data-icon="inline-start" />
              Email
            </CommandItem>
            <CommandItem onSelect={() => (window.location.href = "/login")}>
              <LockKeyhole data-icon="inline-start" />
              Acceso secreto admin
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
