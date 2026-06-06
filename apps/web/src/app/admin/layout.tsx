import { AdminLayout } from "@/components/admin/admin-layout";
import { portfolioClient } from "@/lib/api";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const snapshot = await portfolioClient.snapshot("es");
  return <AdminLayout theme={snapshot.theme}>{children}</AdminLayout>;
}
