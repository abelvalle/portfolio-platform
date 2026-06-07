import { CvOnlinePage } from "@/components/public/cv-online-page";
import { portfolioClient } from "@/lib/api";

export default async function EnglishCvPage() {
  const [snapshot, copy] = await Promise.all([portfolioClient.snapshot("en"), portfolioClient.publicCopy("en")]);
  return <CvOnlinePage snapshot={snapshot} locale="en" copy={copy.cv} />;
}
