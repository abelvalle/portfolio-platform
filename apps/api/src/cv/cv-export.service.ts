import { Injectable } from '@nestjs/common';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { chromium } from 'playwright';

type CvFormationItem = {
  title: string;
  institution?: string;
  date?: string;
  description?: string;
  url?: string;
  certificateUrl?: string;
  credentialId?: string;
};

type CvStructuredData = {
  language?: string;
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
  education?: CvFormationItem[];
  certifications?: CvFormationItem[];
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
  language?: string;
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
type CvExportOrderItem = CvExportSectionKey | 'page-break';

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
    await writeFile(outPath, buffer);
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
    const labels = this.labelsFor(options.language || data.language);
    const pagePadding = template.density === 'compact' ? '36px' : '48px';
    const visibleExperiences = (data.experiences || []).slice(
      0,
      template.density === 'compact' ? 2 : 3,
    );
    const visibleSkills = (data.skills || []).slice(
      0,
      template.density === 'compact' ? 10 : 14,
    );
    const formationRows = this.formationRows(data, labels).slice(
      0,
      template.density === 'compact' ? 2 : 4,
    );

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
      .map((item) => this.htmlListItem(item))
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
        this.htmlSection(
          section.title,
          this.htmlParagraph(section.content),
          'sections',
        ),
      )
      .join('');
    const subtitle = data.profile?.subtitle || data.summary || '';

    const sections = {
      summary: this.htmlSection(
        labels.summary,
        this.htmlParagraph(data.summary),
        'summary',
      ),
      experiences: this.htmlSection(
        options.ats ? labels.experienceAts : labels.experience,
        experienceBody,
        'experiences',
      ),
      formation: this.htmlSection(
        labels.formation,
        formationBody ? `<ul>${formationBody}</ul>` : '',
        'formation',
      ),
      skills: this.htmlSection(
        'Skills',
        skillChips ? `<div class="cv-chips">${skillChips}</div>` : '',
        'skills',
      ),
      languages: this.htmlSection(
        labels.languages,
        languageRows ? `<ul>${languageRows}</ul>` : '',
        'languages',
      ),
      projects: this.htmlSection(labels.projects, projectBody, 'projects'),
      sections: customSections,
    };
    const orderedSections = this.orderedHtmlItems(data)
      .map((key) =>
        key === 'page-break' ? this.htmlPageBreak() : sections[key],
      )
      .join('');

    return `<!doctype html><html><head><meta charset="utf-8"><style>${this.htmlStyles(template, pagePadding)}</style></head><body><main class="cv-page" data-page-size="A4" data-cv-renderer="server-html" data-cv-density="${template.density}" data-cv-template="${this.html(options.template?.slug || 'default')}"><header class="cv-header" data-cv-section="header"><div><p class="cv-eyebrow">${this.html(data.profile?.headline || '')}</p><h1>${this.html(data.profile?.fullName || 'Abel Valle Rosa')}</h1>${this.htmlParagraph(subtitle, 'cv-subtitle')}</div>${this.htmlPhoto(data, template)}</header><section class="cv-contact" data-cv-section="contact">${this.htmlContactItems(data)}</section>${orderedSections}</main></body></html>`;
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

  private htmlSection(title: string, body: string, section?: string) {
    const sectionAttribute = section
      ? ` data-cv-section="${this.html(section)}"`
      : '';
    return body.trim()
      ? `<section${sectionAttribute}><h2>${this.html(title)}</h2>${body}</section>`
      : '';
  }

  private orderedSectionKeys(data: CvStructuredData): CvExportSectionKey[] {
    return this.orderedItems(data, false) as CvExportSectionKey[];
  }

  private orderedHtmlItems(data: CvStructuredData): CvExportOrderItem[] {
    return this.orderedItems(data, true);
  }

  private orderedItems(
    data: CvStructuredData,
    includePageBreaks: boolean,
  ): CvExportOrderItem[] {
    const defaultOrder: CvExportSectionKey[] = [
      'summary',
      'experiences',
      'formation',
      'skills',
      'languages',
      'projects',
      'sections',
    ];
    const aliases: Record<string, CvExportOrderItem> = {
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
      'page-break': 'page-break',
      pagebreak: 'page-break',
      salto: 'page-break',
      'salto de pagina': 'page-break',
    };
    const requested = (data.sectionOrder || [])
      .map((item) => aliases[item.trim().toLowerCase()])
      .filter((item): item is CvExportOrderItem => Boolean(item));
    const seen = new Set<CvExportSectionKey>();
    const ordered: CvExportOrderItem[] = [];

    for (const item of requested) {
      if (item === 'page-break') {
        if (includePageBreaks && ordered.length) {
          ordered.push(item);
        }
        continue;
      }
      if (!seen.has(item)) {
        seen.add(item);
        ordered.push(item);
      }
    }

    for (const item of defaultOrder) {
      if (!seen.has(item)) {
        ordered.push(item);
      }
    }

    return ordered;
  }

  private htmlPageBreak() {
    return '<div class="cv-page-break" data-cv-section="page-break" aria-hidden="true"></div>';
  }

  private docxSectionBlocks(
    data: CvStructuredData,
    template: ResolvedTemplateOptions,
    options: CvTemplateExportOptions,
  ) {
    const labels = this.labelsFor(options.language || data.language);
    const blocks: Record<CvExportSectionKey, Paragraph[]> = {
      summary: [
        this.heading(labels.summary, 18, template),
        this.text(data.summary || '', template),
      ],
      experiences: [
        this.heading(
          options.ats ? labels.experienceAts : labels.experience,
          18,
          template,
        ),
        ...this.experienceParagraphs(data, template),
      ],
      formation: [
        this.heading(labels.formation, 18, template),
        ...this.simpleList(
          this.formationRows(data, labels),
          (item) => item,
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
        this.heading(labels.languages, 18, template),
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
        this.heading(labels.projects, 18, template),
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
      '@media print{body{background:#fff}.cv-page{min-height:auto;margin:0;overflow:visible;box-shadow:none}.cv-page section,.cv-page article{break-inside:avoid;page-break-inside:avoid}}',
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
      '.cv-page-break{height:0;break-before:page;page-break-before:always}',
    ].join('');
  }

  private htmlContactItems(data: CvStructuredData) {
    const profile = data.profile || {};
    return [profile.email, profile.phone, profile.location, profile.linkedin]
      .filter(Boolean)
      .map(
        (item) => `<span data-cv-contact-item="true">${this.html(item)}</span>`,
      )
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

  private formationRows(data: CvStructuredData, labels = this.labelsFor()) {
    return [...(data.education || []), ...(data.certifications || [])].map(
      (item) =>
        [
          item.title,
          item.institution,
          item.date,
          item.description,
          item.url,
          item.certificateUrl
            ? `${labels.certificate}: ${item.certificateUrl}`
            : '',
          item.credentialId ? `${labels.credential}: ${item.credentialId}` : '',
        ]
          .filter(Boolean)
          .join(' - '),
    );
  }

  private labelsFor(language = 'es') {
    if (language.toLowerCase().startsWith('en')) {
      return {
        summary: 'Professional summary',
        experience: 'Experience',
        experienceAts: 'Professional experience',
        formation: 'Education and certifications',
        languages: 'Languages',
        projects: 'Projects',
        certificate: 'Certificate',
        credential: 'ID',
      };
    }

    return {
      summary: 'Resumen profesional',
      experience: 'Experiencia',
      experienceAts: 'Experiencia profesional',
      formation: 'Formacion y certificaciones',
      languages: 'Idiomas',
      projects: 'Proyectos',
      certificate: 'Certificado',
      credential: 'ID',
    };
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
