import { CvEditor } from "@/components/admin/cv-editor";
import { CvPreview } from "@/components/admin/cv-preview";

export default function CvEditorPage() {
  return (
    <div className="grid gap-6">
      <CvEditor />
      <CvPreview />
    </div>
  );
}
