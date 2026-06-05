import { CvAtsService } from './cv-ats.service';

describe('CvAtsService', () => {
  const service = new CvAtsService();

  it('scores a structured CV with contact, summary, experience and skills as strong', () => {
    const result = service.validate({
      profile: {
        headline: 'IT Project Manager | Delivery Manager',
        email: 'abel@example.com',
        phone: '+34 600 000 000',
      },
      summary:
        'IT Project Manager especializado en delivery, KPIs, UAT, cliente, Agile, Cloud y DevOps en entornos enterprise.',
      experiences: [
        {
          role: 'Project Manager',
          company: 'Experis',
          responsibilities: ['Gestión de backlog', 'Seguimiento de KPIs'],
          technologies: ['Azure', 'Docker', 'Postman'],
          methodologies: ['Scrum', 'Kanban', 'UAT'],
        },
      ],
      education: [{ title: 'CFGS', institution: 'Salesianas', date: '2013' }],
      skills: [
        'Delivery Management',
        'KPIs',
        'UAT',
        'Scrum',
        'Kanban',
        'Azure',
        'Docker',
        'Stakeholders',
        'Reporting',
        'Client Communication',
        'Backlog',
        'Sprint Reviews',
      ].map((name) => ({ name })),
    });

    expect(result.status).toBe('strong');
    expect(result.recommendations).toHaveLength(0);
  });

  it('returns recommendations when critical ATS sections are missing', () => {
    const result = service.validate({
      profile: { email: 'abel@example.com' },
      skills: [],
    });

    expect(result.status).toBe('needs_work');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
