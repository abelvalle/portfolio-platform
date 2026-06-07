"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Gauge,
  Image,
  Inbox,
  Layers,
  Rocket,
  Settings,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { adminClient, type AppModuleItem } from "@/lib/api";

const items = [
  { href: "/admin", label: "Dashboard", icon: Gauge, moduleKey: "dashboard" },
  { href: "/admin/portfolio", label: "Portfolio", icon: UserRound, moduleKey: "portfolio" },
  { href: "/admin/cv", label: "CV Manager", icon: FileText, moduleKey: "cv-manager" },
  { href: "/admin/portfolio/projects", label: "Proyectos", icon: FolderKanban, moduleKey: "projects" },
  { href: "/admin/messages", label: "Mensajes", icon: Inbox, moduleKey: "messages" },
  { href: "/admin/analytics", label: "Analítica", icon: BarChart3, moduleKey: "analytics" },
  { href: "/admin/media", label: "Media", icon: Image, moduleKey: "media" },
  { href: "/admin/settings/publication", label: "Publicacion", icon: Rocket },
  { href: "/admin/settings/users", label: "Usuarios", icon: ShieldCheck },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
  { href: "/admin/settings/modules", label: "Módulos", icon: Layers }
];

export function AdminSidebar() {
  const [modules, setModules] = useState<AppModuleItem[]>([]);

  useEffect(() => {
    let ignore = false;

    adminClient.appModules()
      .then((nextModules) => {
        if (!ignore) {
          setModules(nextModules);
        }
      })
      .catch(() => {
        if (!ignore) {
          setModules([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const visibleItems = useMemo(() => {
    if (!modules.length) {
      return items;
    }

    const disabledKeys = new Set(modules.filter((module) => !module.enabled).map((module) => module.key));
    return items.filter((item) => !item.moduleKey || !disabledKeys.has(item.moduleKey));
  }, [modules]);

  return (
    <aside className="sticky top-0 hidden h-dvh border-r border-border bg-sidebar p-4 lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2 py-3">
        <BriefcaseBusiness />
        <span className="font-semibold">Portfolio Platform</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <item.icon data-icon="inline-start" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
