import { ThemeEditor } from "@/components/admin/theme-editor";
import { portfolioClient } from "@/lib/api";

export default async function ThemePage() {
  const snapshot = await portfolioClient.snapshot("es");
  return <ThemeEditor initialTheme={snapshot.theme} />;
}
