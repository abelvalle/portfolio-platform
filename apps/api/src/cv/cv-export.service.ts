import { Injectable } from '@nestjs/common';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';

type CvStructuredData = {
  profile?: {
    fullName?: string;
    headline?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
  };
  summary?: string;
  experiences?: Array<{
    role: string;
    company: string;
    description: string;
    responsibilities?: string[];
    achievements?: string[];
  }>;
  education?: Array<{ title: string; institution: string; date: string }>;
  certifications?: Array<{ title: string; institution: string; date: string }>;
  skills?: Array<{ name: string; category: string }>;
  languages?: Array<{ name: string; level: string }>;
};

@Injectable()
export class CvExportService {
  storageDir = process.env.STORAGE_DIR || 'storage';

  async generateDocx(versionId: string, data: CvStructuredData) {
    const outDir = this.ensureCvDir();
    const filename = `${versionId}.docx`;
    const outPath = join(outDir, filename);
    const doc = new Document({
      sections: [
        {
          children: [
            this.heading(data.profile?.fullName || 'Abel Valle Rosa', 30),
            this.text(
              data.profile?.headline || 'IT Project Manager | Delivery Manager',
              true,
            ),
            this.text(this.contactLine(data)),
            this.heading('Resumen profesional', 18),
            this.text(data.summary || ''),
            this.heading('Experiencia', 18),
            ...this.experienceParagraphs(data),
            this.heading('Formación y certificaciones', 18),
            ...this.simpleList(
              [...(data.education || []), ...(data.certifications || [])],
              (item) => `${item.title} · ${item.institution} · ${item.date}`,
            ),
            this.heading('Skills', 18),
            this.text(
              (data.skills || []).map((skill) => skill.name).join(' · '),
            ),
            this.heading('Idiomas', 18),
            this.text(
              (data.languages || [])
                .map((language) => `${language.name}: ${language.level}`)
                .join(' · '),
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    await import('node:fs/promises').then((fs) =>
      fs.writeFile(outPath, buffer),
    );
    return { filename, path: outPath, url: `/media/generated/${filename}` };
  }

  async generatePdf(versionId: string, data: CvStructuredData) {
    const outDir = this.ensureCvDir();
    const filename = `${versionId}.pdf`;
    const outPath = join(outDir, filename);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 48, size: 'A4' });
      const stream = createWriteStream(outPath);
      doc.pipe(stream);
      doc.fontSize(24).text(data.profile?.fullName || 'Abel Valle Rosa');
      doc
        .fontSize(12)
        .fillColor('#334155')
        .text(
          data.profile?.headline || 'IT Project Manager | Delivery Manager',
        );
      doc
        .moveDown(0.5)
        .fontSize(9)
        .fillColor('#475569')
        .text(this.contactLine(data));
      this.pdfSection(doc, 'Resumen profesional', [data.summary || '']);
      this.pdfSection(
        doc,
        'Experiencia',
        (data.experiences || []).map(
          (exp) =>
            `${exp.role} · ${exp.company}\n${exp.description}\n${[...(exp.responsibilities || []), ...(exp.achievements || [])].join('\n')}`,
        ),
      );
      this.pdfSection(
        doc,
        'Formación y certificaciones',
        [...(data.education || []), ...(data.certifications || [])].map(
          (item) => `${item.title} · ${item.institution} · ${item.date}`,
        ),
      );
      this.pdfSection(doc, 'Skills', [
        (data.skills || []).map((skill) => skill.name).join(' · '),
      ]);
      this.pdfSection(doc, 'Idiomas', [
        (data.languages || [])
          .map((language) => `${language.name}: ${language.level}`)
          .join(' · '),
      ]);
      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { filename, path: outPath, url: `/media/generated/${filename}` };
  }

  renderHtml(data: CvStructuredData) {
    return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:48px}h1{font-size:32px}h2{font-size:16px;border-top:1px solid #cbd5e1;padding-top:14px}</style></head><body><h1>${data.profile?.fullName || 'Abel Valle Rosa'}</h1><p>${data.profile?.headline || ''}</p><h2>Resumen profesional</h2><p>${data.summary || ''}</p></body></html>`;
  }

  private ensureCvDir() {
    const dir = join(process.cwd(), this.storageDir, 'cv');
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  private heading(text: string, size: number) {
    return new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [new TextRun({ text, bold: true, size: size * 2 })],
    });
  }

  private text(text: string, bold = false) {
    return new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text, bold, size: 20 })],
    });
  }

  private simpleList<T>(items: T[], render: (item: T) => string) {
    return items.map((item) => this.text(render(item)));
  }

  private experienceParagraphs(data: CvStructuredData) {
    return (data.experiences || []).flatMap((experience) => [
      this.text(`${experience.role} · ${experience.company}`, true),
      this.text(experience.description),
      ...this.simpleList(
        [
          ...(experience.responsibilities || []),
          ...(experience.achievements || []),
        ],
        (item) => `- ${item}`,
      ),
    ]);
  }

  private contactLine(data: CvStructuredData) {
    const profile = data.profile || {};
    return [profile.location, profile.email, profile.phone, profile.linkedin]
      .filter(Boolean)
      .join(' · ');
  }

  private pdfSection(doc: PDFKit.PDFDocument, title: string, rows: string[]) {
    doc
      .moveDown(1)
      .fontSize(13)
      .fillColor('#0f172a')
      .text(title, { underline: true });
    rows.filter(Boolean).forEach((row) => {
      doc
        .moveDown(0.4)
        .fontSize(9)
        .fillColor('#111827')
        .text(row, { lineGap: 3 });
    });
  }
}
