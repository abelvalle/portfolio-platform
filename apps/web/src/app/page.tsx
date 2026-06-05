import { PublicLanding } from "@/components/public/public-landing";
import { portfolioClient } from "@/lib/api";

export default async function Home() {
  const snapshot = await portfolioClient.snapshot("es");
  return <PublicLanding snapshot={snapshot} locale="es" />;
}
