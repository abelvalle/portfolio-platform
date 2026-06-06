import { Injectable } from '@nestjs/common';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { mkdirSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { chromium } from 'playwright';

type CvStructuredData = {
  profile?: {
    fullName?: string;
    headline?: string;
    subtitle?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
    avatarUrl?: string;
  };
  summary?: string;
  experiences?: Array<{
    role: string;
    company: string;
    period?: string;
    description?: string;
    responsibilities?: string[];
    achievements?: string[];
  }>;
  education?: Array<{ title: string; institution?: string; date?: string }>;
  certifications?: Array<{
    title: string;
    institution?: string;
    date?: string;
  }>;
  skills?: Array<{ name: string; category?: string }>;
  languages?: Array<{ name: string; level?: string }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
  }>;
  sections?: Array<{ title: string; content?: string }>;
  sectionOrder?: string[];
};

type CvTemplateExportOptions = {
  ats?: boolean;
  template?: {
    name: string;
    slug: string;
    config: unknown;
  };
};

type ResolvedTemplateOptions = {
  primaryColor: string;
  fontFamily: string;
  density: 'compact' | 'normal';
  includePhoto: boolean;
};

type CvExportSectionKey =
  | 'summary'
  | 'experiences'
  | 'formation'
  | 'skills'
  | 'languages'
  | 'projects'
  | 'sections';

@Injectable()
export class CvExportService {
  storageDir = process.env.STORAGE_DIR || 'storage';

  async generateDocx(
    versionId: string,
    data: CvStructuredData,
    options: CvTemplateExportOptions = {},
  ) {
    const template = this.resolveTemplateOptions(options);
    const outDir = this.ensureCvDir();
    const filename = this.generatedFilename(versionId, 'docx', options);
    const outPath = join(outDir, filename);
    const doc = new Document({
      sections: [
        {
          children: [
            this.heading(
              data.profile?.fullName || 'Abel Valle Rosa',
              template.density === 'compact' ? 26 : 30,
              template,
            ),
            this.text(
              data.profile?.headline || 'IT Project Manager | Delivery Manager',
              template,
              true,
            ),
            this.text(this.contactLine(data), template),
            ...this.docxSectionBlocks(data, template, options),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    await import('node:fs/promises').then((fs) =>
      fs.writeFile(outPath, buffer),
    );
    return { filename, path: outPath, url: `/media/generated/${filename}` };
  }

  async generatePdf(
    versionId: string,
    data: CvStructuredData,
    options: CvTemplateExportOptions = {},
  ) {
    const outDir = this.ensureCvDir();
    const filename = this.generatedFilename(versionId, 'pdf', options);
    const outPath = join(outDir, filename);
    await this.writePdfFromHtml(this.renderHtml(data, options), outPath);

    return { filename, path: outPath, url: `/media/generated/${filename}` };
  }

  renderHtml(data: CvStructuredData, options: CvTemplateExportOptions = {}) {
    const template = this.resolveTemplateOptions(options);
    const pagePadding = template.density === 'compact' ? '36px' : '48px';
    const visibleExperiences = (data.experiences || []).slice(
      0,
      template.density === 'compact' ? 2 : 3,
    );
    const visibleSkills = (data.skills || []).slice(
      0,
      template.density === 'compact' ? 10 : 14,
    );
    const formationRows = [
      ...(data.education || []),
      ...(data.certifications || []),
    ].slice(0, template.density === 'compact' ? 2 : 4);

    const experienceBody = visibleExperiences
      .map((experience) =>
        this.htmlArticle(
          `${experience.role} - ${experience.company}`,
          [experience.period, experience.description],
          [
            ...(experience.responsibilities || []),
            ...(experience.achievements || []),
          ],
        ),
      )
      .join('');
    const formationBody = formationRows
      .map((item) =>
        this.htmlListItem(
          [item.title, item.institution, item.date].filter(Boolean).join(' - '),
        ),
      )
      .join('');
    const skillChips = visibleSkills
      .map((skill) => `<span class="cv-chip">${this.html(skill.name)}</span>`)
      .join('');
    const languageRows = (data.languages || [])
      .map((language) =>
        this.htmlListItem(
          language.level
            ? `${language.name}: ${language.level}`
            : language.name,
        ),
      )
      .join('');
    const projectBody = (data.projects || [])
      .map((project) =>
        this.htmlArticle(
          project.name,
          [project.description],
          project.technologies || [],
        ),
      )
      .join('');
    const customSections = (data.sections || [])
      .map((section) =>
        this.htmlSection(section.title, this.htmlParagraph(section.content)),
      )
      .join('');
    const subtitle = data.profile?.subtitle || data.summary || '';

    const sections = {
      summary: this.htmlSection(
        'Resumen profesional',
        this.htmlParagraph(data.summary),
      ),
      experiences: this.htmlSection(
        options.ats ? 'Experiencia profesional' : 'Experiencia',
        experienceBody,
      ),
      formation: this.htmlSection(
        'Formacion y certificaciones',
        formationBody ? `<ul>${formationBody}</ul>` : '',
      ),
      skills: this.htmlSection(
        'Skills',
        skillChips ? `<div class="cv-chips">${skillChips}</div>` : '',
      ),
      languages: this.htmlSection(
        'Idiomas',
        languageRows ? `<ul>${languageRows}</ul>` : '',
      ),
      projects: this.htmlSection('Proyectos', projectBody),
      sections: customSections,
    };
    const orderedSections = this.orderedSectionKeys(data)
      .map((key) => sections[key])
      .join('');

    return `<!doctype html><html><head><meta charset="utf-8"><style>${this.htmlStyles(template, pagePadding)}</style></head><body><main class="cv-page" data-page-size="A4"><header class="cv-header"><div><p class="cv-eyebrow">${this.html(data.profile?.headline || '')}</p><h1>${this.html(data.profile?.fullName || 'Abel Valle Rosa')}</h1>${this.htmlParagraph(subtitle, 'cv-subtitle')}</div>${this.htmlPhoto(data, template)}</header><section class="cv-contact">${this.htmlContactItems(data)}</section>${orderedSections}</main></body></html>`;
  }

  private html(value: unknown) {
    const text =
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
        ? String(value)
        : '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private htmlParagraph(value: unknown, className?: string) {
    const text = this.html(value);
    const classAttribute = className ? ` class="${className}"` : '';
    return text ? `<p${classAttribute}>${text}</p>` : '';
  }

  private htmlListItem(value: unknown) {
    const text = this.html(value);
    return text ? `<li>${text}</li>` : '';
  }

  private htmlArticle(
    title: string,
    paragraphs: unknown[],
    bullets: unknown[],
  ) {
    const body = [
      `<h3>${this.html(title)}</h3>`,
      ...paragraphs.map((paragraph) => this.htmlParagraph(paragraph)),
      bullets.length
        ? `<ul>${bullets.map((bullet) => this.htmlListItem(bullet)).join('')}</ul>`
        : '',
    ].join('');
    return `<article>${body}</article>`;
  }

  private htmlSection(title: string, body: string) {
    return body.trim()
      ? `<section><h2>${this.html(title)}</h2>${body}</section>`
      : '';
  }

  private orderedSectionKeys(data: CvStructuredData): CvExportSectionKey[] {
    const defaultOrder: CvExportSectionKey[] = [
      'summary',
      'experiences',
      'formation',
      'skills',
      'languages',
      'projects',
      'sections',
    ];
    const aliases: Record<string, CvExportSectionKey> = {
      summary: 'summary',
      resumen: 'summary',
      experience: 'experiences',
      experiences: 'experiences',
      experiencia: 'experiences',
      experiencias: 'experiences',
      formation: 'formation',
      formacion: 'formation',
      education: 'formation',
      educacion: 'formation',
      certifications: 'formation',
      certificaciones: 'formation',
      skills: 'skills',
      habilidades: 'skills',
      languages: 'languages',
      idiomas: 'languages',
      projects: 'projects',
      proyectos: 'projects',
      sections: 'sections',
      secciones: 'sections',
      custom: 'sections',
    };
    const requested = (data.sectionOrder || [])
      .map((item) => aliases[item.trim().toLowerCase()])
      .filter((item): item is CvExportSectionKey => Boolean(item));
    return Array.from(new Set([...requested, ...defaultOrder]));
  }

  private docxSectionBlocks(
    data: CvStructuredData,
    template: ResolvedTemplateOptions,
    options: CvTemplateExportOptions,
  ) {
    const blocks: Record<CvExportSectionKey, Paragraph[]> = {
      summary: [
        this.heading('Resumen profesional', 18, template),
        this.text(data.summary || '', template),
      ],
      experiences: [
        this.heading(
          options.ats ? 'Experiencia profesional' : 'Experiencia',
          18,
          template,
        ),
        ...this.experienceParagraphs(data, template),
      ],
      formation: [
        this.heading('Formacion y certificaciones', 18, template),
        ...this.simpleList(
          [...(data.education || []), ...(data.certifications || [])],
          (item) =>
            [item.title, item.institution, item.date]
              .filter(Boolean)
              .join(' - '),
          template,
        ),
      ],
      skills: [
        this.heading('Skills', 18, template),
        this.text(
          (data.skills || []).map((skill) => skill.name).join(' - '),
          template,
        ),
      ],
      languages: [
        this.heading('Idiomas', 18, template),
        this.text(
          (data.languages || [])
            .map((language) =>
              language.level
                ? `${language.name}: ${language.level}`
                : language.name,
            )
            .join(' - '),
          template,
        ),
      ],
      projects: [
        this.heading('Proyectos', 18, template),
        ...this.simpleList(this.projectRows(data), (item) => item, template),
      ],
      sections: this.customSectionParagraphs(data, template),
    };

    return this.orderedSectionKeys(data).flatMap((key) => blocks[key]);
  }

  private htmlStyles(template: ResolvedTemplateOptions, pagePadding: string) {
    return [
      '@page{size:A4;margin:0}',
      '*{box-sizing:border-box}',
      `body{margin:0;background:#f8fafc;font-family:${template.fontFamily},Arial,sans-serif;color:#0f172a}`,
      `.cv-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:${pagePadding};line-height:1.45;overflow:hidden}`,
      '@media screen{body{padding:24px}.cv-page{box-shadow:0 24px 60px rgba(15,23,42,.18)}}',
      '.cv-header{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:start;border-bottom:1px solid #e2e8f0;padding-bottom:20px}',
      `.cv-eyebrow{margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;color:${template.primaryColor}}`,
      `h1{font-size:${template.density === 'compact' ? '28px' : '32px'};line-height:1.12;color:#0f172a;margin:0}`,
      '.cv-subtitle{max-width:620px;margin:12px 0 0;color:#475569;font-size:13px}',
      '.cv-photo{width:96px;height:96px;border:1px solid #e2e8f0;border-radius:8px;object-fit:cover;display:grid;place-items:center;background:#f8fafc;color:#334155;font-weight:700}',
      '.cv-contact{display:flex;flex-wrap:wrap;gap:8px 16px;padding:18px 0 4px;color:#475569;font-size:12px}',
      `h2{font-size:13px;border-top:1px solid #cbd5e1;padding-top:14px;color:${template.primaryColor};margin:18px 0 10px;text-transform:uppercase}`,
      'article{margin:0 0 14px}',
      'h3{font-size:13px;margin:0 0 4px}',
      'p{margin:0 0 8px}',
      'ul{margin:0 0 10px 18px;padding:0}',
      'li{margin:0 0 4px}',
      '.cv-chips{display:flex;flex-wrap:wrap;gap:6px}',
      '.cv-chip{border:1px solid #e2e8f0;border-radius:4px;padding:3px 8px;font-size:10px}',
    ].join('');
  }

  private htmlContactItems(data: CvStructuredData) {
    const profile = data.profile || {};
    return [profile.email, profile.phone, profile.location, profile.linkedin]
      .filter(Boolean)
      .map((item) => `<span>${this.html(item)}</span>`)
      .join('');
  }

  private htmlPhoto(data: CvStructuredData, template: ResolvedTemplateOptions) {
    if (!template.includePhoto) {
      return '';
    }
    const avatarUrl = data.profile?.avatarUrl;
    if (avatarUrl) {
      return `<img class="cv-photo" src="${this.html(avatarUrl)}" alt="${this.html(data.profile?.fullName || 'CV photo')}">`;
    }
    return `<div class="cv-photo" aria-hidden="true">${this.html(this.profileInitials(data))}</div>`;
  }

  private profileInitials(data: CvStructuredData) {
    return (data.profile?.fullName || 'Abel Valle Rosa')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private ensureCvDir() {
    const baseDir = isAbsolute(this.storageDir)
      ? this.storageDir
      : join(process.cwd(), this.storageDir);
    const dir = join(baseDir, 'cv');
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  private heading(
    text: string,
    size: number,
    template: ResolvedTemplateOptions,
  ) {
    return new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [
        new TextRun({
          text,
          bold: true,
          size: size * 2,
          color: this.hexColor(template.primaryColor),
          font: template.fontFamily,
        }),
      ],
    });
  }

  private text(text: string, template: ResolvedTemplateOptions, bold = false) {
    return new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text,
          bold,
          size: template.density === 'compact' ? 18 : 20,
          font: template.fontFamily,
        }),
      ],
    });
  }

  private simpleList<T>(
    items: T[],
    render: (item: T) => string,
    template: ResolvedTemplateOptions,
  ) {
    return items.map((item) => this.text(render(item), template));
  }

  private experienceParagraphs(
    data: CvStructuredData,
    template: ResolvedTemplateOptions,
  ) {
    return (data.experiences || []).flatMap((experience) => [
      this.text(`${experience.role} - ${experience.company}`, template, true),
      this.text(experience.description || '', template),
      ...this.simpleList(
        [
          ...(experience.responsibilities || []),
          ...(experience.achievements || []),
        ],
        (item) => `- ${item}`,
        template,
      ),
    ]);
  }

  private contactLine(data: CvStructuredData) {
    const profile = data.profile || {};
    return [profile.location, profile.email, profile.phone, profile.linkedin]
      .filter(Boolean)
      .join(' - ');
  }

  private projectRows(data: CvStructuredData) {
    return (data.projects || []).map((project) =>
      [
        project.name,
        project.description,
        (project.technologies || []).join(' - '),
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }

  private customSectionRows(data: CvStructuredData) {
    return (data.sections || [])
      .filter((section) => section.title)
      .map((section) => ({
        title: section.title,
        rows: [section.content || ''].filter(Boolean),
      }));
  }

  private customSectionParagraphs(
    data: CvStructuredData,
    template: ResolvedTemplateOptions,
  ) {
    return this.customSectionRows(data).flatMap((section) => [
      this.heading(section.title, 18, template),
      ...this.simpleList(section.rows, (item) => item, template),
    ]);
  }

  private generatedFilename(
    versionId: string,
    extension: 'pdf' | 'docx',
    options: CvTemplateExportOptions,
  ) {
    const templateSlug = options.template?.slug
      ? `-${this.safeFilename(options.template.slug)}`
      : '';
    return `${versionId}${templateSlug}${options.ats ? '-ats' : ''}.${extension}`;
  }

  private resolveTemplateOptions(
    options: CvTemplateExportOptions,
  ): ResolvedTemplateOptions {
    const config =
      options.template?.config &&
      typeof options.template.config === 'object' &&
      !Array.isArray(options.template.config)
        ? (options.template.config as Record<string, unknown>)
        : {};

    return {
      primaryColor: options.ats
        ? '#111827'
        : this.colorConfig(config.primaryColor, '#0f766e'),
      fontFamily: this.stringConfig(config.fontFamily, 'Inter'),
      density:
        options.ats || config.density !== 'compact' ? 'normal' : 'compact',
      includePhoto: !options.ats && config.includePhoto !== false,
    };
  }

  private colorConfig(value: unknown, fallback: string) {
    if (typeof value !== 'string') {
      return fallback;
    }
    return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  private stringConfig(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value : fallback;
  }

  private safeFilename(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  }

  private async writePdfFromHtml(html: string, outPath: string) {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage({
        viewport: { width: 794, height: 1123 },
      });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.pdf({
        path: outPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
    } finally {
      await browser.close();
    }
  }

  private hexColor(value: string) {
    return value.replace('#', '').toUpperCase();
  }
}
