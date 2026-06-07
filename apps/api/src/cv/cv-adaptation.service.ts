import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CvAiAdapterService,
  type AiAdaptationSuggestion,
} from './cv-ai-adapter.service';
import { AdaptCvDto, CompareVersionsDto } from './cv.dto';

@Injectable()
export class CvAdaptationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAdapter: CvAiAdapterService,
  ) {}

  async adapt(dto: AdaptCvDto) {
    const base = await this.prisma.cvVersion.findUnique({
      where: { id: dto.baseCvVersionId },
    });
    if (!base) {
      throw new NotFoundException('Base CV version not found');
    }

    const targetRolePreset = dto.targetRoleId
      ? await this.prisma.cvTargetRole.findFirst({
          where: { id: dto.targetRoleId, deletedAt: null },
        })
      : null;
    if (dto.targetRoleId && !targetRolePreset) {
      throw new NotFoundException('CV target role not found');
    }

    const source = base.structuredJson as Record<string, any>;
    const keywords = this.extractKeywords(
      `${dto.targetRole} ${dto.jobDescription}`,
    );
    const aiSuggestion = await this.aiAdapter.propose({
      targetRole: dto.targetRole,
      targetCompany: dto.targetCompany,
      jobDescription: dto.jobDescription,
      keywords,
      source,
    });
    const skills = (source.skills || []) as any[];
    const experiences = (source.experiences || []) as any[];
    const trace = this.adaptationTrace({
      dto,
      source,
      keywords,
      aiSuggestion,
      baseCvVersionId: base.id,
      targetRoleId: targetRolePreset?.id,
    });
    const proposed = {
      ...source,
      summary: this.orientSummary(source.summary, dto.targetRole),
      skills: this.rankSkills(
        skills,
        keywords,
        aiSuggestion?.prioritizedSkillNames,
      ),
      experiences: this.rankExperiences(
        experiences,
        keywords,
        aiSuggestion?.prioritizedExperienceCompanies,
      ),
      adaptationMeta: {
        targetRole: dto.targetRole,
        targetRoleId: targetRolePreset?.id,
        targetRolePreset: targetRolePreset
          ? {
              id: targetRolePreset.id,
              name: targetRolePreset.name,
              keywords: targetRolePreset.keywords,
            }
          : undefined,
        targetCompany: dto.targetCompany,
        keywords,
        mode: aiSuggestion ? 'ai_assisted_with_rule_guardrails' : 'rules',
        aiSuggestion,
        trace,
        pendingReview: true,
        guardrail:
          'No se han inventado empresas, fechas, títulos ni certificaciones. Las sugerencias IA quedan pendientes de revisión humana y solo pueden reordenar datos existentes.',
      },
    };

    const request = await this.prisma.cvAdaptationRequest.create({
      data: {
        baseCvVersionId: base.id,
        targetRoleId: targetRolePreset?.id,
        targetRole: dto.targetRole,
        targetCompany: dto.targetCompany,
        jobDescription: dto.jobDescription,
        proposedJson: proposed as any,
        traceJson: trace as any,
      },
    });

    return { request, proposed };
  }

  async compare(dto: CompareVersionsDto) {
    const [base, adapted] = await Promise.all([
      this.prisma.cvVersion.findUnique({ where: { id: dto.baseCvVersionId } }),
      this.prisma.cvVersion.findUnique({
        where: { id: dto.adaptedCvVersionId },
      }),
    ]);

    if (!base || !adapted) {
      throw new NotFoundException('CV version not found');
    }

    const baseJson = base.structuredJson as Record<string, any>;
    const adaptedJson = adapted.structuredJson as Record<string, any>;

    return {
      summary: { base: baseJson.summary, adapted: adaptedJson.summary },
      skillsOrder: {
        base: (baseJson.skills || []).map((skill) => skill.name),
        adapted: (adaptedJson.skills || []).map((skill) => skill.name),
      },
      highlightedExperience: {
        base: (baseJson.experiences || []).map(
          (experience) => `${experience.role} · ${experience.company}`,
        ),
        adapted: (adaptedJson.experiences || []).map(
          (experience) => `${experience.role} · ${experience.company}`,
        ),
      },
      sectionOrder: {
        base: this.sectionOrder(baseJson),
        adapted: this.sectionOrder(adaptedJson),
      },
    };
  }

  private sectionOrder(data: Record<string, any>) {
    return Array.isArray(data.sectionOrder)
      ? data.sectionOrder.filter((item) => typeof item === 'string')
      : Object.keys(data);
  }

  private extractKeywords(text: string) {
    const normalized = text.toLowerCase();
    const vocabulary = [
      'delivery',
      'project',
      'manager',
      'scrum',
      'kanban',
      'stakeholders',
      'cliente',
      'uat',
      'kpi',
      'reporting',
      'azure',
      'cloud',
      'devops',
      'docker',
      'kubernetes',
      'api',
      'microservicios',
    ];
    return vocabulary.filter((keyword) => normalized.includes(keyword));
  }

  private rankByKeywords<T>(
    items: T[],
    keywords: string[],
    render: (item: T) => string,
    boost: (item: T) => number = () => 0,
  ) {
    return [...items].sort(
      (a, b) =>
        this.score(render(b), keywords) +
        boost(b) -
        (this.score(render(a), keywords) + boost(a)),
    );
  }

  private rankSkills(
    skills: any[],
    keywords: string[],
    prioritizedSkillNames?: string[],
  ) {
    const prioritized = new Set(
      (prioritizedSkillNames || []).map((name) => name.toLowerCase()),
    );
    return this.rankByKeywords(
      skills,
      keywords,
      (skill) => `${skill.name} ${skill.category}`,
      (skill) => (prioritized.has(String(skill.name).toLowerCase()) ? 10 : 0),
    );
  }

  private rankExperiences(
    experiences: any[],
    keywords: string[],
    prioritizedCompanies?: string[],
  ) {
    const prioritized = new Set(
      (prioritizedCompanies || []).map((company) => company.toLowerCase()),
    );
    return this.rankByKeywords(
      experiences,
      keywords,
      (experience) =>
        `${experience.role} ${experience.company} ${experience.description} ${(experience.responsibilities || []).join(' ')} ${(experience.technologies || []).join(' ')}`,
      (experience) =>
        prioritized.has(String(experience.company).toLowerCase()) ? 10 : 0,
    );
  }

  private score(text: string, keywords: string[]) {
    const normalized = text.toLowerCase();
    return keywords.reduce(
      (total, keyword) => total + (normalized.includes(keyword) ? 1 : 0),
      0,
    );
  }

  private orientSummary(summary = '', targetRole: string) {
    return `${summary} Versión orientada a ${targetRole}, pendiente de revisión humana para confirmar tono, prioridad de logros y ajuste a la oferta concreta.`;
  }

  private adaptationTrace({
    dto,
    source,
    keywords,
    aiSuggestion,
    baseCvVersionId,
    targetRoleId,
  }: {
    dto: AdaptCvDto;
    source: Record<string, any>;
    keywords: string[];
    aiSuggestion: AiAdaptationSuggestion | null;
    baseCvVersionId: string;
    targetRoleId?: string;
  }) {
    const skills = Array.isArray(source.skills) ? source.skills : [];
    const experiences = Array.isArray(source.experiences)
      ? source.experiences
      : [];

    return {
      strategy: aiSuggestion ? 'external-ai-with-rule-guardrails' : 'rules',
      provider: aiSuggestion?.provider || 'rules',
      generatedAt: new Date().toISOString(),
      input: {
        baseCvVersionId,
        targetRoleId,
        targetRole: dto.targetRole,
        hasTargetCompany: Boolean(dto.targetCompany),
        jobDescriptionLength: dto.jobDescription.length,
        keywords,
      },
      sourceShape: {
        summaryLength:
          typeof source.summary === 'string' ? source.summary.length : 0,
        skillCount: skills.length,
        experienceCount: experiences.length,
        skillNames: skills.map((skill) => this.cleanTraceText(skill.name)),
        experienceRefs: experiences.map((experience) => ({
          role: this.cleanTraceText(experience.role),
          company: this.cleanTraceText(experience.company),
        })),
      },
      suggestionShape: {
        hasSuggestedSummary: Boolean(aiSuggestion?.suggestedSummary),
        suggestedSummaryLength: aiSuggestion?.suggestedSummary?.length || 0,
        prioritizedSkillNames: aiSuggestion?.prioritizedSkillNames || [],
        prioritizedExperienceCompanies:
          aiSuggestion?.prioritizedExperienceCompanies || [],
        notesCount: aiSuggestion?.notes?.length || 0,
        pendingReview: true,
      },
      redaction: {
        promptStored: false,
        responseStoredInTrace: false,
        excludes: ['email', 'links', 'privateNotes', 'apiKeys', 'tokens'],
      },
    };
  }

  private cleanTraceText(value: unknown) {
    return typeof value === 'string' && value.trim()
      ? value.trim().slice(0, 120)
      : null;
  }
}
