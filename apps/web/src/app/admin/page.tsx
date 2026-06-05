import Link from "next/link";
import { DashboardCards } from "@/components/admin/dashboard-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Resumen operativo del portfolio, CV y actividad.</p>
      </div>
      <DashboardCards />
      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/portfolio">Editar landing</Link>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/cv">CV Manager</Link>
          <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/messages">Mensajes</Link>
        </CardContent>
      </Card>
    </div>
  );
}
