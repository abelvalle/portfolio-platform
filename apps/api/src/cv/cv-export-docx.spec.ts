import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
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
          education: [
            {
              title: 'Project Management',
              institution: 'Demo Institute',
              date: '2026',
              description: 'Formacion demo',
              url: 'https://example.com/formacion',
            },
          ],
          certifications: [
            {
              title: 'Scrum Master',
              institution: 'Demo Academy',
              credentialId: 'SCRUM-DEMO-2026',
              certificateUrl: 'https://example.com/certificado',
            },
          ],
          skills: [{ name: 'KPIs' }, { name: 'UAT' }],
          sectionOrder: ['summary', 'experiences', 'formation', 'skills'],
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
      const zip = await JSZip.loadAsync(docx);
      const documentFile = zip.file('word/document.xml');

      if (!documentFile) {
        throw new Error('Generated DOCX is missing word/document.xml');
      }

      const documentXml = await documentFile.async('string');

      expect(result.filename).toBe('version-real-docx-executive.docx');
      expect(result.url).toBe(
        '/media/generated/version-real-docx-executive.docx',
      );
      expect(docx.subarray(0, 2).toString()).toBe('PK');
      expect(packageIndex).toContain('[Content_Types].xml');
      expect(packageIndex).toContain('word/document.xml');
      expect(zip.file('[Content_Types].xml')).not.toBeNull();
      expect(documentXml).toContain('Formacion demo');
      expect(documentXml).toContain('https://example.com/formacion');
      expect(documentXml).toContain('SCRUM-DEMO-2026');
      expect(documentXml).toContain('https://example.com/certificado');
      expect(documentXml.indexOf('Resumen profesional')).toBeLessThan(
        documentXml.indexOf('Experiencia'),
      );
      expect(documentXml.indexOf('Experiencia')).toBeLessThan(
        documentXml.indexOf('Formacion y certificaciones'),
      );
      expect(
        documentXml.indexOf('Formacion y certificaciones'),
      ).toBeLessThan(documentXml.indexOf('Skills'));
      expect(docx.byteLength).toBeGreaterThan(5_000);
    } finally {
      rmSync(storageRoot, { recursive: true, force: true });
    }
  });
});
