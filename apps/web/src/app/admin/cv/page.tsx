import Link from "next/link";
import { CvPreview } from "@/components/admin/cv-preview";
import { FileUploader } from "@/components/admin/file-uploader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CvManagerPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CV Manager</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/cv/editor">Editor</Link>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/cv/templates">Plantillas</Link>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/cv/versions">Versiones</Link>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/cv/adapt">Adaptar CV</Link>
            <Link className={cn(buttonVariants({ variant: "outline" }))} href="/admin/cv/compare">Comparar</Link>
          </CardContent>
        </Card>
        <FileUploader />
      </div>
      <CvPreview />
    </div>
  );
}
