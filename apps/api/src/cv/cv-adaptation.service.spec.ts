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
        traceJson: expect.objectContaining({
          provider: 'rules',
          redaction: expect.objectContaining({
            promptStored: false,
            responseStoredInTrace: false,
          }),
        }),
      }),
    });
    const createdData = prisma.cvAdaptationRequest.create.mock.calls[0][0]
      .data as { traceJson: unknown };
    const traceText = JSON.stringify(createdData.traceJson);
    expect(traceText).not.toContain('private@example.com');
    expect(traceText).not.toContain('https://linkedin.example');
    expect(traceText).not.toContain('drop me');
    expect(traceText).not.toContain('Buscamos Delivery Manager');
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

  it('records sanitized trace metadata for external AI suggestions', async () => {
    const prisma = mockPrisma();
    const service = new CvAdaptationService(
      prisma as never,
      {
        propose: jest.fn().mockResolvedValue({
          provider: 'external-ai',
          suggestedSummary: 'Delivery summary from provider',
          prioritizedSkillNames: ['UAT'],
          prioritizedExperienceCompanies: ['Empresa real'],
          notes: ['Review tone'],
          pendingReview: true,
        }),
      } as never,
    );

    const result = await service.adapt({
      baseCvVersionId: 'cv-base',
      targetRole: 'Delivery Manager',
      targetCompany: 'Target Co',
      jobDescription:
        'Buscamos Delivery Manager con KPIs, UAT, stakeholders, reporting y gestion de cliente.',
    });

    const createdData = prisma.cvAdaptationRequest.create.mock.calls[0][0]
      .data as { traceJson: Record<string, unknown> };
    expect(createdData.traceJson).toEqual(
      expect.objectContaining({
        strategy: 'external-ai-with-rule-guardrails',
        provider: 'external-ai',
        input: expect.objectContaining({
          hasTargetCompany: true,
          jobDescriptionLength: expect.any(Number),
        }),
        suggestionShape: expect.objectContaining({
          hasSuggestedSummary: true,
          suggestedSummaryLength: 'Delivery summary from provider'.length,
          notesCount: 1,
          pendingReview: true,
        }),
      }),
    );
    expect(result.proposed.adaptationMeta.trace).toEqual(createdData.traceJson);
    const traceText = JSON.stringify(createdData.traceJson);
    expect(traceText).not.toContain('Delivery summary from provider');
    expect(traceText).not.toContain('Review tone');
    expect(traceText).not.toContain('private@example.com');
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
          email: 'private@example.com',
          links: [{ label: 'LinkedIn', url: 'https://linkedin.example' }],
          skills: [{ name: 'UAT', category: 'Delivery' }],
          experiences: [
            {
              role: 'IT Project Manager',
              company: 'Empresa real',
              description: 'Gestion de proyectos y UAT.',
              responsibilities: ['Coordinar UAT'],
              technologies: [],
              privateNotes: 'drop me',
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
