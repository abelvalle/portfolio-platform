import { Injectable } from '@nestjs/common';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';

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
};

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
            this.heading('Resumen profesional', 18, template),
            this.text(data.summary || '', template),
            this.heading(
              options.ats ? 'Experiencia profesional' : 'Experiencia',
              18,
              template,
            ),
            ...this.experienceParagraphs(data, template),
            this.heading('Formacion y certificaciones', 18, template),
            ...this.simpleList(
              [...(data.education || []), ...(data.certifications || [])],
              (item) =>
                [item.title, item.institution, item.date]
                  .filter(Boolean)
                  .join(' - '),
              template,
            ),
            this.heading('Skills', 18, template),
            this.text(
              (data.skills || []).map((skill) => skill.name).join(' - '),
              template,
            ),
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
            this.heading('Proyectos', 18, template),
            ...this.simpleList(
              this.projectRows(data),
              (item) => item,
              template,
            ),
            ...this.customSectionParagraphs(data, template),
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
    const template = this.resolveTemplateOptions(options);
    const outDir = this.ensureCvDir();
    const filename = this.generatedFilename(versionId, 'pdf', options);
    const outPath = join(outDir, filename);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: options.ats || template.density === 'compact' ? 42 : 48,
        size: 'A4',
      });
      const stream = createWriteStream(outPath);
      doc.pipe(stream);
      doc
        .fontSize(template.density === 'compact' ? 21 : 24)
        .fillColor(template.primaryColor)
        .text(data.profile?.fullName || 'Abel Valle Rosa');
      doc
        .fontSize(12)
        .fillColor(options.ats ? '#111827' : '#334155')
        .text(
          data.profile?.headline || 'IT Project Manager | Delivery Manager',
        );
      doc
        .moveDown(0.5)
        .fontSize(9)
        .fillColor('#475569')
        .text(this.contactLine(data));
      this.pdfSection(
        doc,
        'Resumen profesional',
        [data.summary || ''],
        template,
      );
      this.pdfSection(
        doc,
        options.ats ? 'Experiencia profesional' : 'Experiencia',
        (data.experiences || []).map(
          (exp) =>
            `${exp.role} - ${exp.company}\n${exp.description || ''}\n${[...(exp.responsibilities || []), ...(exp.achievements || [])].join('\n')}`,
        ),
        template,
      );
      this.pdfSection(
        doc,
        'Formacion y certificaciones',
        [...(data.education || []), ...(data.certifications || [])].map(
          (item) =>
            [item.title, item.institution, item.date]
              .filter(Boolean)
              .join(' - '),
        ),
        template,
      );
      this.pdfSection(
        doc,
        'Skills',
        [(data.skills || []).map((skill) => skill.name).join(' - ')],
        template,
      );
      this.pdfSection(
        doc,
        'Idiomas',
        [
          (data.languages || [])
            .map((language) =>
              language.level
                ? `${language.name}: ${language.level}`
                : language.name,
            )
            .join(' - '),
        ],
        template,
      );
      this.pdfSection(doc, 'Proyectos', this.projectRows(data), template);
      for (const section of this.customSectionRows(data)) {
        this.pdfSection(doc, section.title, section.rows, template);
      }
      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { filename, path: outPath, url: `/media/generated/${filename}` };
  }

  renderHtml(data: CvStructuredData, options: CvTemplateExportOptions = {}) {
    const template = this.resolveTemplateOptions(options);
    const pagePadding = template.density === 'compact' ? '36px' : '48px';
    const experienceBody = (data.experiences || [])
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
    const formationRows = [
      ...(data.education || []),
      ...(data.certifications || []),
    ]
      .map((item) =>
        this.htmlListItem(
          [item.title, item.institution, item.date].filter(Boolean).join(' - '),
        ),
      )
      .join('');
    const skillRows = (data.skills || [])
      .map((skill) =>
        this.htmlListItem(
          skill.category ? `${skill.name} - ${skill.category}` : skill.name,
        ),
      )
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

    return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#f8fafc;font-family:${template.fontFamily},Arial,sans-serif;color:#0f172a}.cv-page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:${pagePadding};line-height:1.45}@media screen{body{padding:24px}.cv-page{box-shadow:0 24px 60px rgba(15,23,42,.18)}}h1{font-size:32px;color:${template.primaryColor};margin:0 0 6px}h2{font-size:16px;border-top:1px solid #cbd5e1;padding-top:14px;color:${template.primaryColor};margin-top:20px}article{margin:0 0 14px}h3{font-size:13px;margin:0 0 4px}p{margin:0 0 8px}ul{margin:0 0 10px 18px;padding:0}li{margin:0 0 4px}</style></head><body><main class="cv-page" data-page-size="A4"><h1>${this.html(data.profile?.fullName || 'Abel Valle Rosa')}</h1><p>${this.html(data.profile?.headline || '')}</p><p>${this.html(this.contactLine(data))}</p>${this.htmlSection('Resumen profesional', this.htmlParagraph(data.summary))}${this.htmlSection(options.ats ? 'Experiencia profesional' : 'Experiencia', experienceBody)}${this.htmlSection('Formacion y certificaciones', formationRows ? `<ul>${formationRows}</ul>` : '')}${this.htmlSection('Skills', skillRows ? `<ul>${skillRows}</ul>` : '')}${this.htmlSection('Idiomas', languageRows ? `<ul>${languageRows}</ul>` : '')}${this.htmlSection('Proyectos', projectBody)}${customSections}</main></body></html>`;
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

  private htmlParagraph(value: unknown) {
    const text = this.html(value);
    return text ? `<p>${text}</p>` : '';
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

  private ensureCvDir() {
    const dir = join(process.cwd(), this.storageDir, 'cv');
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

  private pdfSection(
    doc: PDFKit.PDFDocument,
    title: string,
    rows: string[],
    template: ResolvedTemplateOptions,
  ) {
    doc
      .moveDown(1)
      .fontSize(13)
      .fillColor(template.primaryColor)
      .text(title, { underline: true });
    rows.filter(Boolean).forEach((row) => {
      doc
        .moveDown(template.density === 'compact' ? 0.25 : 0.4)
        .fontSize(template.density === 'compact' ? 8 : 9)
        .fillColor('#111827')
        .text(row, { lineGap: 3 });
    });
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

  private hexColor(value: string) {
    return value.replace('#', '').toUpperCase();
  }
}
