import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Gauge,
  Image,
  Inbox,
  Layers,
  Settings,
  ShieldCheck,
  UserRound
} from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/portfolio", label: "Portfolio", icon: UserRound },
  { href: "/admin/cv", label: "CV Manager", icon: FileText },
  { href: "/admin/portfolio/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/admin/messages", label: "Mensajes", icon: Inbox },
  { href: "/admin/analytics", label: "Analítica", icon: BarChart3 },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/settings/users", label: "Usuarios", icon: ShieldCheck },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
  { href: "/admin/settings#modules", label: "Módulos futuros", icon: Layers }
];

export function AdminSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh border-r border-border bg-sidebar p-4 lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2 py-3">
        <BriefcaseBusiness />
        <span className="font-semibold">Portfolio Platform</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <item.icon data-icon="inline-start" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
