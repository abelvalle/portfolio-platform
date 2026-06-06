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
          },
        ],
        certifications: [
          { title: 'Scrum Master', institution: 'Demo Academy', date: '2026' },
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
    expect(html).toContain('@page{size:A4;margin:0}');
    expect(html).toContain('class="cv-page" data-page-size="A4"');
    expect(html).toContain('width:210mm;min-height:297mm');
    expect(html).toContain('@media screen');
    expect(html).toContain('Delivery Manager - Demo Company');
    expect(html).toContain('Reporting ejecutivo');
    expect(html).toContain('Formacion y certificaciones');
    expect(html).toContain('Portfolio Platform');
    expect(html).toContain('Publicaciones');
    expect(html).toContain('Resumen &lt;seguro&gt;');
  });
});
