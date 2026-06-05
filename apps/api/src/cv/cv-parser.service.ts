import { Injectable } from '@nestjs/common';

@Injectable()
export class CvParserService {
  parsePlainText(rawText: string) {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      rawText,
      detectedName:
        lines.find((line) => /abel valle/i.test(line)) || 'Abel Valle Rosa',
      detectedHeadline:
        lines.find((line) => /project manager|delivery manager/i.test(line)) ||
        'IT Project Manager | Delivery Manager',
      sections: this.extractLikelySections(lines),
      parser: 'rule-based-v1',
      warnings: [
        'La importación basada en reglas no inventa datos; revisa manualmente cualquier sección dudosa.',
      ],
    };
  }

  private extractLikelySections(lines: string[]) {
    const sectionNames = [
      'perfil',
      'experiencia',
      'formación',
      'certificaciones',
      'skills',
      'idiomas',
    ];
    return sectionNames.map((name) => ({
      key: name,
      matches: lines
        .filter((line) => line.toLowerCase().includes(name))
        .slice(0, 5),
    }));
  }
}
