import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type AiAdaptationInput = {
  targetRole: string;
  targetCompany?: string;
  jobDescription: string;
  keywords: string[];
  source: Record<string, any>;
};

export type AiAdaptationSuggestion = {
  provider: 'external-ai';
  suggestedSummary?: string;
  prioritizedSkillNames?: string[];
  prioritizedExperienceCompanies?: string[];
  notes?: string[];
  pendingReview: true;
};

@Injectable()
export class CvAiAdapterService {
  private readonly logger = new Logger(CvAiAdapterService.name);

  constructor(private readonly configService: ConfigService) {}

  async propose(
    input: AiAdaptationInput,
  ): Promise<AiAdaptationSuggestion | null> {
    const url = this.configService.get<string>('CV_AI_ADAPTER_URL');
    if (!url) {
      return null;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.authHeaders(),
      };
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetRole: input.targetRole,
          targetCompany: input.targetCompany,
          jobDescription: input.jobDescription,
          keywords: input.keywords,
          source: this.safeSource(input.source),
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        this.logger.warn(`AI adapter returned ${response.status}`);
        return null;
      }

      return this.sanitizeSuggestion(
        (await response.json()) as Record<string, unknown>,
      );
    } catch (error) {
      this.logger.warn(`AI adapter unavailable: ${(error as Error).message}`);
      return null;
    }
  }

  private authHeaders(): Record<string, string> {
    const token = this.configService.get<string>('CV_AI_ADAPTER_API_KEY');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private safeSource(source: Record<string, any>) {
    return {
      summary: source.summary,
      skills: (source.skills || []).map((skill: any) => ({
        name: skill.name,
        category: skill.category,
      })),
      experiences: (source.experiences || []).map((experience: any) => ({
        role: experience.role,
        company: experience.company,
        description: experience.description,
        responsibilities: experience.responsibilities,
        achievements: experience.achievements,
        technologies: experience.technologies,
      })),
    };
  }

  private sanitizeSuggestion(
    data: Record<string, unknown>,
  ): AiAdaptationSuggestion {
    return {
      provider: 'external-ai',
      suggestedSummary: this.optionalString(data.suggestedSummary),
      prioritizedSkillNames: this.optionalStringArray(
        data.prioritizedSkillNames,
      ),
      prioritizedExperienceCompanies: this.optionalStringArray(
        data.prioritizedExperienceCompanies,
      ),
      notes: this.optionalStringArray(data.notes),
      pendingReview: true,
    };
  }

  private optionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private optionalStringArray(value: unknown) {
    return Array.isArray(value)
      ? value
          .filter(
            (item): item is string =>
              typeof item === 'string' && Boolean(item.trim()),
          )
          .map((item) => item.trim())
      : undefined;
  }
}
