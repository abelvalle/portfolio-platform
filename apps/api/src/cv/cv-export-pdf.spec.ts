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

  it('lets long server-side CV content paginate across PDF pages', async () => {
    const storageDir = join(
      'storage-test',
      `cv-long-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    const storageRoot = join(process.cwd(), storageDir);
    const service = new CvExportService();
    service.storageDir = storageDir;

    try {
      const result = await service.generatePdf(
        'version-long-pdf',
        {
          profile: {
            fullName: 'Abel Valle Rosa',
            headline: 'IT Project Manager | Delivery Manager',
            email: 'abel@example.com',
          },
          summary:
            'Gestion IT, delivery, KPIs, UAT, cliente y coordinacion de equipos multidisciplinares.',
          experiences: Array.from({ length: 3 }, (_, index) => ({
            role: `IT Project Manager ${index + 1}`,
            company: 'Demo Company',
            period: '2024 - 2026',
            description:
              'Coordinacion de delivery, seguimiento de hitos y reporting ejecutivo.',
            responsibilities: [
              'Gestion de stakeholders y priorizacion de backlog.',
              'Coordinacion UAT y seguimiento de KPIs.',
              'Gobierno de riesgos y dependencias tecnicas.',
            ],
          })),
          skills: Array.from({ length: 14 }, (_, index) => ({
            name: `Skill ${index + 1}`,
          })),
          projects: Array.from({ length: 16 }, (_, index) => ({
            name: `Proyecto CV ${index + 1}`,
            description:
              'Iniciativa de portfolio, automatizacion, reporting y mejora operativa.',
            technologies: ['Agile', 'KPIs', 'Cloud', 'DevOps'],
          })),
          sections: Array.from({ length: 8 }, (_, index) => ({
            title: `Seccion adicional ${index + 1}`,
            content:
              'Bloque adicional usado para validar que el PDF puede continuar en paginas siguientes.',
          })),
          sectionOrder: [
            'summary',
            'experiences',
            'skills',
            'projects',
            'sections',
          ],
        },
        {
          template: {
            name: 'ATS-friendly',
            slug: 'ats-friendly',
            config: { density: 'compact', primaryColor: '#111827' },
          },
        },
      );
      const pdfText = readFileSync(result.path).toString('latin1');

      expect(countPdfPages(pdfText)).toBeGreaterThan(1);
    } finally {
      rmSync(storageRoot, { recursive: true, force: true });
    }
  });
});

function countPdfPages(pdfText: string) {
  return (pdfText.match(/\/Type\s*\/Page\b/g) || []).length;
}
