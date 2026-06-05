import Link from "next/link";
import { LogOut } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./admin-sidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[280px_1fr]">
      <AdminSidebar />
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Admin</p>
            <p className="text-sm text-muted-foreground">Contenido, CV, mensajes y analítica</p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            <LogOut data-icon="inline-start" />
            Salir
          </Link>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
