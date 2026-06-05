import { PublicLanding } from "@/components/public/public-landing";
import { portfolioClient } from "@/lib/api";

export default async function EnglishHome() {
  const snapshot = await portfolioClient.snapshot("en");
  return <PublicLanding snapshot={snapshot} locale="en" />;
}
