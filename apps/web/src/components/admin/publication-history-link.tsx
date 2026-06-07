import Link from "next/link";
import { History } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicationHistoryLink() {
  return (
    <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/settings/publication">
      <History data-icon="inline-start" />
      Historial y restore
    </Link>
  );
}
