import { CvOnlinePage } from "@/components/public/cv-online-page";
import { portfolioClient } from "@/lib/api";
import { publicCopy } from "@/lib/i18n";

export default async function CvPage() {
  const snapshot = await portfolioClient.snapshot("es");
  return <CvOnlinePage snapshot={snapshot} locale="es" copy={publicCopy.es.cv} />;
}
