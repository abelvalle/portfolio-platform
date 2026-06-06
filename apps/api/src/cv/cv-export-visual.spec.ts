import { Browser, chromium } from 'playwright';
import { CvExportService } from './cv-export.service';

describe('CvExportService visual rendering', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('renders non-empty A4 server HTML with expected sections and proportions', async () => {
    const service = new CvExportService();
    const html = service.renderHtml(
      {
        profile: {
          fullName: 'Abel Valle Rosa',
          headline: 'IT Project Manager | Delivery Manager',
          subtitle: 'Gestion IT, KPIs, UAT y cliente',
          email: 'abel@example.com',
          location: 'Zaragoza',
        },
        summary: 'Perfil orientado a delivery, reporting y gestion agil.',
        experiences: [
          {
            role: 'IT Project Manager',
            company: 'Demo Company',
            period: '2025',
            description: 'Coordinacion de delivery y UAT.',
            responsibilities: ['Reporting ejecutivo', 'Gestion de cliente'],
          },
        ],
        education: [
          {
            title: 'Project Management',
            institution: 'Demo Institute',
            date: '2025',
          },
        ],
        skills: [{ name: 'KPIs' }, { name: 'UAT' }, { name: 'Agile' }],
        languages: [{ name: 'Espanol', level: 'Nativo' }],
        projects: [{ name: 'Portfolio Platform', description: 'CV Manager' }],
        sections: [{ title: 'Notas', content: 'Contenido adicional.' }],
        sectionOrder: [
          'summary',
          'experiences',
          'formation',
          'skills',
          'languages',
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
    const page = await browser.newPage({
      viewport: { width: 1000, height: 1400 },
    });

    try {
      await page.setContent(html, { waitUntil: 'networkidle' });
      const pageLocator = page.locator('[data-cv-renderer="server-html"]');
      const box = await pageLocator.boundingBox();
      const sections = await page
        .locator('[data-cv-section]')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-cv-section')),
        );
      const screenshot = await pageLocator.screenshot();

      expect(box).not.toBeNull();
      expect(box?.width).toBeGreaterThan(700);
      expect((box?.height || 0) / (box?.width || 1)).toBeCloseTo(297 / 210, 1);
      expect(sections).toEqual(
        expect.arrayContaining([
          'header',
          'contact',
          'summary',
          'experiences',
          'formation',
          'skills',
          'languages',
          'projects',
          'sections',
        ]),
      );
      expect(screenshot.byteLength).toBeGreaterThan(10_000);
    } finally {
      await page.close();
    }
  });
});
