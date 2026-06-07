import { PublicLanding } from "@/components/public/public-landing";
import { portfolioClient } from "@/lib/api";

export default async function EnglishHome() {
  const [snapshot, copy] = await Promise.all([portfolioClient.snapshot("en"), portfolioClient.publicCopy("en")]);
  return <PublicLanding snapshot={snapshot} locale="en" copy={copy} />;
}
