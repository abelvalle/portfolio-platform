import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { CvExportService } from './cv-export.service';

describe('CvExportService DOCX generation', () => {
  it('writes a real DOCX package with Word document entries', async () => {
    const storageDir = join(
      'storage-test',
      `cv-real-docx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    const storageRoot = join(process.cwd(), storageDir);
    const service = new CvExportService();
    service.storageDir = storageDir;

    try {
      const result = await service.generateDocx(
        'version-real-docx',
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
            name: 'Ejecutiva',
            slug: 'executive',
            config: { density: 'normal', primaryColor: '#0f766e' },
          },
        },
      );
      const docx = readFileSync(result.path);
      const packageIndex = docx.toString('latin1');

      expect(result.filename).toBe('version-real-docx-executive.docx');
      expect(result.url).toBe(
        '/media/generated/version-real-docx-executive.docx',
      );
      expect(docx.subarray(0, 2).toString()).toBe('PK');
      expect(packageIndex).toContain('[Content_Types].xml');
      expect(packageIndex).toContain('word/document.xml');
      expect(docx.byteLength).toBeGreaterThan(5_000);
    } finally {
      rmSync(storageRoot, { recursive: true, force: true });
    }
  });
});
