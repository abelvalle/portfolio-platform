import { CvOnlinePage } from "@/components/public/cv-online-page";
import { portfolioClient } from "@/lib/api";

export default async function CvPage() {
  const [snapshot, copy] = await Promise.all([portfolioClient.snapshot("es"), portfolioClient.publicCopy("es")]);
  return <CvOnlinePage snapshot={snapshot} locale="es" copy={copy.cv} />;
}
