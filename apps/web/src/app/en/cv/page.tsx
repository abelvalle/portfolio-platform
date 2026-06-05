import { CvOnlinePage } from "@/components/public/cv-online-page";
import { portfolioClient } from "@/lib/api";
import { publicCopy } from "@/lib/i18n";

export default async function EnglishCvPage() {
  const snapshot = await portfolioClient.snapshot("en");
  return <CvOnlinePage snapshot={snapshot} locale="en" copy={publicCopy.en.cv} />;
}
