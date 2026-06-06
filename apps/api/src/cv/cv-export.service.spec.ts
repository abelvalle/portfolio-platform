import { CvExportService } from './cv-export.service';

describe('CvExportService', () => {
  it('applies CV template config to HTML rendering', () => {
    const service = new CvExportService();

    const html = service.renderHtml(
      {
        profile: {
          fullName: 'Abel Valle Rosa',
          headline: 'IT Project Manager',
        },
        summary: 'Resumen',
      },
      {
        template: {
          name: 'Ejecutiva',
          slug: 'ejecutiva',
          config: {
            fontFamily: 'Manrope',
            primaryColor: '#123456',
            density: 'compact',
          },
        },
      },
    );

    expect(html).toContain('font-family:Manrope');
    expect(html).toContain('color:#123456');
    expect(html).toContain('padding:36px');
  });
});
