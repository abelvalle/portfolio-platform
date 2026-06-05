import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdaptCvDto, CompareVersionsDto } from './cv.dto';

@Injectable()
export class CvAdaptationService {
  constructor(private readonly prisma: PrismaService) {}

  async adapt(dto: AdaptCvDto) {
    const base = await this.prisma.cvVersion.findUnique({
      where: { id: dto.baseCvVersionId },
    });
    if (!base) {
      throw new NotFoundException('Base CV version not found');
    }

    const source = base.structuredJson as Record<string, any>;
    const keywords = this.extractKeywords(
      `${dto.targetRole} ${dto.jobDescription}`,
    );
    const skills = (source.skills || []) as any[];
    const experiences = (source.experiences || []) as any[];
    const proposed = {
      ...source,
      summary: this.orientSummary(source.summary, dto.targetRole),
      skills: this.rankByKeywords(
        skills,
        keywords,
        (skill) => `${skill.name} ${skill.category}`,
      ),
      experiences: this.rankByKeywords(
        experiences,
        keywords,
        (experience) =>
          `${experience.role} ${experience.company} ${experience.description} ${(experience.responsibilities || []).join(' ')} ${(experience.technologies || []).join(' ')}`,
      ),
      adaptationMeta: {
        targetRole: dto.targetRole,
        targetCompany: dto.targetCompany,
        keywords,
        pendingReview: true,
        guardrail:
          'No se han inventado empresas, fechas, títulos ni certificaciones. Revisa el resumen sugerido antes de publicar.',
      },
    };

    const request = await this.prisma.cvAdaptationRequest.create({
      data: {
        baseCvVersionId: base.id,
        targetRole: dto.targetRole,
        targetCompany: dto.targetCompany,
        jobDescription: dto.jobDescription,
        proposedJson: proposed as any,
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
        base: Object.keys(baseJson),
        adapted: Object.keys(adaptedJson),
      },
    };
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
  ) {
    return [...items].sort(
      (a, b) =>
        this.score(render(b), keywords) - this.score(render(a), keywords),
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
}
