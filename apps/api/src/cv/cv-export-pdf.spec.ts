import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { CvExportService } from './cv-export.service';

describe('CvExportService PDF generation', () => {
  it('writes a real PDF file from server-side A4 HTML', async () => {
    const storageDir = join(
      'storage-test',
      `cv-real-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    const storageRoot = join(process.cwd(), storageDir);
    const service = new CvExportService();
    service.storageDir = storageDir;

    try {
      const result = await service.generatePdf(
        'version-real-pdf',
        {
          profile: {
            fullName: 'Abel Valle Rosa',
            headline: 'IT Project Manager | Delivery Manager',
            email: 'abel@example.com',
          },
          summary: 'Gestion IT, delivery, KPIs y UAT.',
          experiences: [
            {
              role: 'IT Project Manager',
              company: 'Demo Company',
              period: '2025',
              description: 'Delivery y reporting ejecutivo.',
            },
          ],
          skills: [{ name: 'KPIs' }, { name: 'UAT' }],
          sectionOrder: ['summary', 'experiences', 'skills'],
        },
        {
          template: {
            name: 'ATS-friendly',
            slug: 'ats-friendly',
            config: { density: 'compact', primaryColor: '#111827' },
          },
        },
      );
      const pdf = readFileSync(result.path);
      const pdfText = pdf.toString('latin1');

      expect(result.filename).toBe('version-real-pdf-ats-friendly.pdf');
      expect(result.url).toBe(
        '/media/generated/version-real-pdf-ats-friendly.pdf',
      );
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
      expect(pdfText).toContain('%%EOF');
      expect(pdf.byteLength).toBeGreaterThan(5_000);
    } finally {
      rmSync(storageRoot, { recursive: true, force: true });
    }
  });
});
