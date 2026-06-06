import { CvAdaptationService } from './cv-adaptation.service';

describe('CvAdaptationService', () => {
  it('persists the selected CV target role in adaptation requests', async () => {
    const prisma = mockPrisma();
    const service = new CvAdaptationService(
      prisma as never,
      {
        propose: jest.fn().mockResolvedValue(null),
      } as never,
    );

    const result = await service.adapt({
      baseCvVersionId: 'cv-base',
      targetRoleId: 'target-role-1',
      targetRole: 'Delivery Manager',
      jobDescription:
        'Buscamos Delivery Manager con KPIs, UAT, stakeholders, reporting y gestion de cliente.',
    });

    expect(prisma.cvTargetRole.findFirst).toHaveBeenCalledWith({
      where: { id: 'target-role-1', deletedAt: null },
    });
    expect(prisma.cvAdaptationRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        baseCvVersionId: 'cv-base',
        targetRoleId: 'target-role-1',
        targetRole: 'Delivery Manager',
      }),
    });
    expect(result.proposed.adaptationMeta).toEqual(
      expect.objectContaining({
        targetRoleId: 'target-role-1',
        targetRolePreset: {
          id: 'target-role-1',
          name: 'Delivery Manager',
          keywords: ['delivery', 'uat', 'kpi'],
        },
      }),
    );
  });

  it('compares explicit CV section order when available', async () => {
    const prisma = mockPrisma();
    prisma.cvVersion.findUnique
      .mockResolvedValueOnce({
        id: 'base',
        structuredJson: {
          summary: 'Base',
          sectionOrder: ['skills', 'summary', 'experiences'],
          skills: [{ name: 'KPIs' }],
          experiences: [],
        },
      })
      .mockResolvedValueOnce({
        id: 'adapted',
        structuredJson: {
          summary: 'Adapted',
          sectionOrder: ['summary', 'skills', 'experiences'],
          skills: [{ name: 'KPIs' }],
          experiences: [],
        },
      });
    const service = new CvAdaptationService(
      prisma as never,
      {
        propose: jest.fn().mockResolvedValue(null),
      } as never,
    );

    const result = await service.compare({
      baseCvVersionId: 'base',
      adaptedCvVersionId: 'adapted',
    });

    expect(result.sectionOrder).toEqual({
      base: ['skills', 'summary', 'experiences'],
      adapted: ['summary', 'skills', 'experiences'],
    });
  });
});

function mockPrisma() {
  return {
    cvVersion: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'cv-base',
        structuredJson: {
          summary: 'Gestion IT y delivery.',
          skills: [{ name: 'UAT', category: 'Delivery' }],
          experiences: [
            {
              role: 'IT Project Manager',
              company: 'Empresa real',
              description: 'Gestion de proyectos y UAT.',
              responsibilities: ['Coordinar UAT'],
              technologies: [],
            },
          ],
        },
      }),
    },
    cvTargetRole: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'target-role-1',
        name: 'Delivery Manager',
        keywords: ['delivery', 'uat', 'kpi'],
      }),
    },
    cvAdaptationRequest: {
      create: jest.fn(({ data }) =>
        Promise.resolve({
          id: 'adaptation-1',
          status: 'pending_review',
          ...data,
        }),
      ),
    },
  };
}
