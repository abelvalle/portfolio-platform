import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { CvExportService } from './cv-export.service';

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('CvExportService', () => {
  it('prepares projects and custom sections for binary exports', () => {
    const service = new CvExportService() as unknown as {
      projectRows: (data: unknown) => string[];
      formationRows: (data: unknown) => string[];
      customSectionRows: (data: unknown) => Array<{
        title: string;
        rows: string[];
      }>;
    };

    expect(
      service.projectRows({
        projects: [
          {
            name: 'Portfolio Platform',
            description: 'CV Manager',
            technologies: ['Next.js', 'NestJS'],
          },
        ],
      }),
    ).toEqual(['Portfolio Platform\nCV Manager\nNext.js - NestJS']);

    expect(
      service.formationRows({
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
      }),
    ).toEqual([
      'Project Management - Demo Institute - 2026 - Formacion demo - https://example.com/formacion',
      'Scrum Master - Demo Academy - Certificado: https://example.com/certificado - ID: SCRUM-DEMO-2026',
    ]);

    expect(
      service.customSectionRows({
        sections: [
          { title: 'Publicaciones', content: 'Pendiente de revision' },
          { title: '', content: 'Sin titulo' },
        ],
      }),
    ).toEqual([{ title: 'Publicaciones', rows: ['Pendiente de revision'] }]);
  });

  it('applies CV template config to HTML rendering', () => {
    const service = new CvExportService();

    const html = service.renderHtml(
      {
        profile: {
          fullName: 'Abel Valle Rosa',
          headline: 'IT Project Manager',
          subtitle: 'Delivery Manager',
          email: 'abel@example.com',
          location: 'Zaragoza',
          avatarUrl: '/media/abel.png',
        },
        summary: 'Resumen <seguro>',
        experiences: [
          {
            role: 'Delivery Manager',
            company: 'Demo Company',
            period: '2026',
            description: 'Coordinar UAT',
            responsibilities: ['Reporting ejecutivo'],
          },
        ],
        education: [
          {
            title: 'Project Management',
            institution: 'Demo Institute',
            date: '2026',
            url: 'https://example.com/formacion',
          },
        ],
        certifications: [
          {
            title: 'Scrum Master',
            institution: 'Demo Academy',
            date: '2026',
            credentialId: 'SCRUM-DEMO-2026',
          },
        ],
        skills: [{ name: 'KPIs', category: 'Reporting' }],
        languages: [{ name: 'Español', level: 'Nativo' }],
        projects: [
          {
            name: 'Portfolio Platform',
            description: 'CV Manager',
            technologies: ['Next.js'],
          },
        ],
        sections: [
          { title: 'Publicaciones', content: 'Pendiente de revision' },
        ],
        sectionOrder: [
          'skills',
          'summary',
          'sections',
          'experiences',
          'formation',
          'languages',
          'projects',
        ],
      },
      {
        template: {
          name: 'Ejecutiva',
          slug: 'ejecutiva',
          config: {
            fontFamily: 'Manrope',
            primaryColor: '#123456',
            density: 'compact',
            includePhoto: true,
          },
        },
      },
    );

    expect(html).toContain('font-family:Manrope');
    expect(html).toContain('color:#123456');
    expect(html).toContain('padding:36px');
    expect(html).toContain('@page{size:A4;margin:0}');
    expect(html).toContain('class="cv-page" data-page-size="A4"');
    expect(html).toContain('data-cv-renderer="server-html"');
    expect(html).toContain('data-cv-density="compact"');
    expect(html).toContain('https://example.com/formacion');
    expect(html).toContain('ID: SCRUM-DEMO-2026');
    expect(html).toContain('data-cv-template="ejecutiva"');
    expect(html).toContain('width:210mm;min-height:297mm');
    expect(html).toContain('@media screen');
    expect(html).toContain('class="cv-header"');
    expect(html).toContain('data-cv-section="summary"');
    expect(html).toContain('data-cv-section="skills"');
    expect(html).toContain('class="cv-contact"');
    expect(html).toContain('class="cv-photo" src="/media/abel.png"');
    expect(html).toContain('class="cv-chips"');
    expect(html).toContain('class="cv-chip">KPIs</span>');
    expect(html).toContain('Delivery Manager - Demo Company');
    expect(html).toContain('Reporting ejecutivo');
    expect(html).toContain('Formacion y certificaciones');
    expect(html).toContain('Portfolio Platform');
    expect(html).toContain('Publicaciones');
    expect(html).toContain('Resumen &lt;seguro&gt;');
    expect(html.indexOf('<h2>Skills</h2>')).toBeLessThan(
      html.indexOf('<h2>Resumen profesional</h2>'),
    );
    expect(html.indexOf('<h2>Publicaciones</h2>')).toBeLessThan(
      html.indexOf('<h2>Experiencia</h2>'),
    );

    const noPhotoHtml = service.renderHtml(
      { profile: { fullName: 'Abel Valle Rosa' } },
      {
        template: {
          name: 'ATS',
          slug: 'ats-friendly',
          config: { includePhoto: false },
        },
      },
    );
    expect(noPhotoHtml).not.toContain('class="cv-photo"');
  });

  it('generates PDFs from server-side A4 HTML with Playwright', async () => {
    const page = {
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(undefined),
    };
    const browser = {
      newPage: jest.fn().mockResolvedValue(page),
      close: jest.fn().mockResolvedValue(undefined),
    };
    jest.mocked(chromium).launch.mockResolvedValue(browser as never);

    const storageDir = mkdtempSync(join(tmpdir(), 'cv-export-'));
    const service = new CvExportService();
    service.storageDir = storageDir;

    try {
      const result = await service.generatePdf(
        'version-1',
        {
          profile: { fullName: 'Abel Valle Rosa' },
          summary: 'Resumen exportado',
        },
        {
          template: {
            name: 'Minimalista',
            slug: 'minimalista',
            config: { primaryColor: '#0f766e' },
          },
        },
      );

      expect(result.filename).toBe('version-1-minimalista.pdf');
      expect(page.setContent).toHaveBeenCalledWith(
        expect.stringContaining('class="cv-page" data-page-size="A4"'),
        { waitUntil: 'networkidle' },
      );
      expect(page.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          path: result.path,
          format: 'A4',
          printBackground: true,
          preferCSSPageSize: true,
        }),
      );
      expect(browser.close).toHaveBeenCalled();
    } finally {
      rmSync(storageDir, { recursive: true, force: true });
    }
  });
});
