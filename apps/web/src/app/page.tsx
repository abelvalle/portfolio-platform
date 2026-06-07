import { PublicLanding } from "@/components/public/public-landing";
import { portfolioClient } from "@/lib/api";

export default async function Home() {
  const [snapshot, copy] = await Promise.all([portfolioClient.snapshot("es"), portfolioClient.publicCopy("es")]);
  return <PublicLanding snapshot={snapshot} locale="es" copy={copy} />;
}
