import { Injectable } from '@nestjs/common';

type CvStructuredData = {
  profile?: {
    fullName?: string;
    headline?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
  };
  summary?: string;
  experiences?: Array<{
    role?: string;
    company?: string;
    description?: string;
    responsibilities?: string[];
    achievements?: string[];
    technologies?: string[];
    methodologies?: string[];
    skills?: string[];
  }>;
  education?: Array<{ title?: string; institution?: string; date?: string }>;
  certifications?: Array<{
    title?: string;
    institution?: string;
    date?: string;
  }>;
  skills?: Array<{ name?: string; category?: string }>;
  languages?: Array<{ name?: string; level?: string }>;
};

type AtsCheck = {
  key: string;
  label: string;
  passed: boolean;
  weight: number;
  detail: string;
};

@Injectable()
export class CvAtsService {
  private readonly stopWords = new Set([
    'and',
    'con',
    'del',
    'de',
    'en',
    'for',
    'la',
    'las',
    'los',
    'the',
    'una',
    'uno',
    'y',
  ]);

  validate(data: CvStructuredData) {
    const checks: AtsCheck[] = [
      {
        key: 'contact',
        label: 'Contacto legible',
        passed: Boolean(data.profile?.email && data.profile?.phone),
        weight: 15,
        detail: 'Email y teléfono deben estar presentes en texto plano.',
      },
      {
        key: 'headline',
        label: 'Titular profesional',
        passed: Boolean(
          data.profile?.headline && data.profile.headline.length >= 12,
        ),
        weight: 10,
        detail:
          'El titular debe describir el rol objetivo sin depender de diseño visual.',
      },
      {
        key: 'summary',
        label: 'Resumen profesional',
        passed: Boolean(data.summary && data.summary.length >= 80),
        weight: 15,
        detail:
          'El resumen debe tener suficiente contexto para filtros ATS y recruiters.',
      },
      {
        key: 'experience',
        label: 'Experiencia estructurada',
        passed: (data.experiences || []).some(
          (experience) =>
            experience.role &&
            experience.company &&
            ((experience.responsibilities || []).length > 0 ||
              (experience.achievements || []).length > 0),
        ),
        weight: 20,
        detail:
          'Al menos una experiencia debe incluir rol, empresa y bullets de responsabilidad o logro.',
      },
      {
        key: 'skills',
        label: 'Skills detectables',
        passed: (data.skills || []).length >= 8,
        weight: 15,
        detail:
          'Las skills deben ir como texto plano y no solo embebidas en imágenes o iconos.',
      },
      {
        key: 'education',
        label: 'Formación o certificaciones',
        passed:
          [...(data.education || []), ...(data.certifications || [])].length >
          0,
        weight: 10,
        detail:
          'ATS y recruiters suelen buscar formación, certificaciones o cursos relevantes.',
      },
      {
        key: 'keywords',
        label: 'Keywords técnicas y de gestión',
        passed: this.extractKeywords(data).length >= 12,
        weight: 15,
        detail:
          'Debe haber suficientes keywords reales para roles IT Project / Delivery.',
      },
    ];

    const score = checks.reduce(
      (total, check) => total + (check.passed ? check.weight : 0),
      0,
    );
    const failedChecks = checks.filter((check) => !check.passed);

    return {
      score,
      status: score >= 85 ? 'strong' : score >= 65 ? 'review' : 'needs_work',
      checks,
      keywords: this.extractKeywords(data),
      recommendations: failedChecks.map((check) => check.detail),
    };
  }

  validateAgainstJobDescription(
    data: CvStructuredData,
    jobDescription: string,
    targetRole?: string,
  ) {
    const baseReport = this.validate(data);
    const jobKeywords = this.extractJobKeywords(jobDescription);
    const cvText = this.normalizeText(JSON.stringify(data));
    const matchedKeywords = jobKeywords.filter((keyword) =>
      cvText.includes(keyword),
    );
    const missingKeywords = jobKeywords.filter(
      (keyword) => !matchedKeywords.includes(keyword),
    );
    const matchScore = jobKeywords.length
      ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
      : 0;

    return {
      ...baseReport,
      targetRole,
      matchScore,
      jobKeywords,
      matchedKeywords,
      missingKeywords,
      roleRecommendations: missingKeywords
        .slice(0, 8)
        .map(
          (keyword) =>
            `Revisar si "${keyword}" existe en la experiencia real antes de incorporarlo.`,
        ),
    };
  }

  private extractKeywords(data: CvStructuredData) {
    const keywords = new Set<string>();
    for (const skill of data.skills || []) {
      if (skill.name) keywords.add(skill.name);
    }
    for (const experience of data.experiences || []) {
      for (const item of [
        ...(experience.technologies || []),
        ...(experience.methodologies || []),
        ...(experience.skills || []),
      ]) {
        keywords.add(item);
      }
    }
    return [...keywords].slice(0, 40);
  }

  private extractJobKeywords(jobDescription: string) {
    const counts = new Map<string, number>();
    const words = this.normalizeText(jobDescription).match(/[a-z0-9+#.]+/g);
    for (const word of words || []) {
      if (word.length < 3 || this.stopWords.has(word)) {
        continue;
      }
      counts.set(word, (counts.get(word) || 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([word]) => word)
      .slice(0, 30);
  }

  private normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
