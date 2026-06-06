import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Browser, Page, chromium } from 'playwright';
import { CvExportService } from './cv-export.service';

describe('CvExportService visual rendering', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('renders non-empty A4 server HTML with expected sections and proportions', async () => {
    const service = new CvExportService();
    const html = service.renderHtml(
      {
        profile: {
          fullName: 'Abel Valle Rosa',
          headline: 'IT Project Manager | Delivery Manager',
          subtitle: 'Gestion IT, KPIs, UAT y cliente',
          email: 'abel@example.com',
          location: 'Zaragoza',
        },
        summary: 'Perfil orientado a delivery, reporting y gestion agil.',
        experiences: [
          {
            role: 'IT Project Manager',
            company: 'Demo Company',
            period: '2025',
            description: 'Coordinacion de delivery y UAT.',
            responsibilities: ['Reporting ejecutivo', 'Gestion de cliente'],
          },
        ],
        education: [
          {
            title: 'Project Management',
            institution: 'Demo Institute',
            date: '2025',
          },
        ],
        skills: [{ name: 'KPIs' }, { name: 'UAT' }, { name: 'Agile' }],
        languages: [{ name: 'Espanol', level: 'Nativo' }],
        projects: [{ name: 'Portfolio Platform', description: 'CV Manager' }],
        sections: [{ title: 'Notas', content: 'Contenido adicional.' }],
        sectionOrder: [
          'summary',
          'experiences',
          'formation',
          'skills',
          'languages',
          'projects',
          'sections',
        ],
      },
      {
        template: {
          name: 'ATS-friendly',
          slug: 'ats-friendly',
          config: { density: 'compact', primaryColor: '#111827' },
        },
      },
    );
    const page = await browser.newPage({
      viewport: { width: 1000, height: 1400 },
    });

    try {
      await page.setContent(html, { waitUntil: 'networkidle' });
      const pageLocator = page.locator('[data-cv-renderer="server-html"]');
      const box = await pageLocator.boundingBox();
      const sections = await page
        .locator('[data-cv-section]')
        .evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('data-cv-section')),
        );
      const metrics = await pageLocator.evaluate((node) => {
        const element = node as HTMLElement;
        return {
          clientHeight: element.clientHeight,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          scrollWidth: element.scrollWidth,
        };
      });
      const screenshot = await pageLocator.screenshot();

      expect(box).not.toBeNull();
      expect(box?.width).toBeGreaterThan(700);
      expect((box?.height || 0) / (box?.width || 1)).toBeCloseTo(297 / 210, 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.scrollHeight).toBeLessThanOrEqual(
        metrics.clientHeight + 1,
      );
      expect(sections).toEqual(
        expect.arrayContaining([
          'header',
          'contact',
          'summary',
          'experiences',
          'formation',
          'skills',
          'languages',
          'projects',
          'sections',
        ]),
      );
      expect(screenshot.byteLength).toBeGreaterThan(10_000);
    } finally {
      await page.close();
    }
  });

  it('keeps the generated PDF visually close to the server HTML render', async () => {
    const storageDir = join(
      'storage-test',
      `cv-visual-diff-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    const storageRoot = join(process.cwd(), storageDir);
    const service = new CvExportService();
    service.storageDir = storageDir;
    const data = {
      profile: {
        fullName: 'Abel Valle Rosa',
        headline: 'IT Project Manager | Delivery Manager',
        subtitle: 'Gestion IT, KPIs, UAT y cliente',
        email: 'abel@example.com',
        location: 'Zaragoza',
      },
      summary: 'Perfil orientado a delivery, reporting y gestion agil.',
      experiences: [
        {
          role: 'IT Project Manager',
          company: 'Demo Company',
          period: '2025',
          description: 'Coordinacion de delivery y UAT.',
          responsibilities: ['Reporting ejecutivo', 'Gestion de cliente'],
        },
      ],
      education: [
        {
          title: 'Project Management',
          institution: 'Demo Institute',
          date: '2025',
        },
      ],
      skills: [{ name: 'KPIs' }, { name: 'UAT' }, { name: 'Agile' }],
      languages: [{ name: 'Espanol', level: 'Nativo' }],
      projects: [{ name: 'Portfolio Platform', description: 'CV Manager' }],
      sections: [{ title: 'Notas', content: 'Contenido adicional.' }],
      sectionOrder: [
        'summary',
        'experiences',
        'formation',
        'skills',
        'languages',
        'projects',
        'sections',
      ],
    };
    const options = {
      template: {
        name: 'ATS-friendly',
        slug: 'ats-friendly',
        config: { density: 'compact', primaryColor: '#111827' },
      },
    };
    const html = service.renderHtml(data, options);
    const htmlPage = await browser.newPage({
      viewport: { width: 1000, height: 1400 },
    });

    try {
      await htmlPage.setContent(html, { waitUntil: 'networkidle' });
      const htmlScreenshot = await htmlPage
        .locator('[data-cv-renderer="server-html"]')
        .screenshot();
      const pdf = await service.generatePdf(
        'version-visual-diff',
        data,
        options,
      );
      const pdfPage = await browser.newPage({
        viewport: { width: 900, height: 1300 },
      });

      try {
        await installPdfJsRenderer(pdfPage);
        const raster = await renderPdfFirstPage(
          pdfPage,
          readFileSync(pdf.path),
        );
        const diff = await comparePngs(
          pdfPage,
          htmlScreenshot,
          raster.pngDataUrl,
        );

        expect(raster.width).toBeGreaterThan(700);
        expect(raster.height / raster.width).toBeCloseTo(297 / 210, 1);
        expect(diff.nonWhitePdfPixels).toBeGreaterThan(20_000);
        expect(diff.meanDifference).toBeLessThan(0.08);
        expect(diff.significantDifferenceRatio).toBeLessThan(0.08);
      } finally {
        await pdfPage.close();
      }
    } finally {
      await htmlPage.close();
      rmSync(storageRoot, { recursive: true, force: true });
    }
  });
});

async function installPdfJsRenderer(page: Page) {
  const pdfJsScript = readFileSync(
    require.resolve('pdfjs-dist/build/pdf.mjs'),
    'utf8',
  );
  const pdfJsWorker = readFileSync(
    require.resolve('pdfjs-dist/build/pdf.worker.mjs'),
    'utf8',
  );
  await page.route('https://pdfjs.local/pdf.mjs', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: pdfJsScript,
    }),
  );
  await page.route('https://pdfjs.local/pdf.worker.mjs', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: pdfJsWorker,
    }),
  );
  await page.setContent(`<!doctype html><canvas id="pdf-canvas"></canvas>
    <script type="module">
      import * as pdfjsLib from 'https://pdfjs.local/pdf.mjs';
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://pdfjs.local/pdf.worker.mjs';
      window.renderPdfFirstPage = async (base64) => {
        const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 96 / 72 });
        const canvas = document.getElementById('pdf-canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await firstPage.render({
          canvasContext: canvas.getContext('2d'),
          viewport
        }).promise;
        return {
          width: canvas.width,
          height: canvas.height,
          pngDataUrl: canvas.toDataURL('image/png')
        };
      };
    </script>`);
  await page.waitForFunction(
    () => typeof (window as any).renderPdfFirstPage === 'function',
  );
}

async function renderPdfFirstPage(page: Page, pdf: Buffer) {
  return page.evaluate(
    async (base64) => (window as any).renderPdfFirstPage(base64),
    pdf.toString('base64'),
  ) as Promise<{ width: number; height: number; pngDataUrl: string }>;
}

async function comparePngs(
  page: Page,
  htmlScreenshot: Buffer,
  pdfPngDataUrl: string,
) {
  return page.evaluate(
    async ({ htmlPngDataUrl, pdfPngDataUrl }) => {
      const loadImage = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = src;
        });
      const [htmlImage, pdfImage] = await Promise.all([
        loadImage(htmlPngDataUrl),
        loadImage(pdfPngDataUrl),
      ]);
      const width = Math.min(htmlImage.width, pdfImage.width);
      const height = Math.min(htmlImage.height, pdfImage.height);
      const htmlCanvas = document.createElement('canvas');
      const pdfCanvas = document.createElement('canvas');
      htmlCanvas.width = pdfCanvas.width = width;
      htmlCanvas.height = pdfCanvas.height = height;
      const htmlContext = htmlCanvas.getContext('2d')!;
      const pdfContext = pdfCanvas.getContext('2d')!;
      htmlContext.drawImage(htmlImage, 0, 0, width, height);
      pdfContext.drawImage(pdfImage, 0, 0, width, height);
      const htmlPixels = htmlContext.getImageData(0, 0, width, height).data;
      const pdfPixels = pdfContext.getImageData(0, 0, width, height).data;
      let totalDifference = 0;
      let significantDifferences = 0;
      let nonWhitePdfPixels = 0;

      for (let index = 0; index < htmlPixels.length; index += 4) {
        const channelDifference =
          Math.abs(htmlPixels[index] - pdfPixels[index]) +
          Math.abs(htmlPixels[index + 1] - pdfPixels[index + 1]) +
          Math.abs(htmlPixels[index + 2] - pdfPixels[index + 2]);
        totalDifference += channelDifference / 765;
        if (channelDifference > 75) {
          significantDifferences += 1;
        }
        if (
          pdfPixels[index] < 250 ||
          pdfPixels[index + 1] < 250 ||
          pdfPixels[index + 2] < 250
        ) {
          nonWhitePdfPixels += 1;
        }
      }

      const pixelCount = width * height;
      return {
        meanDifference: totalDifference / pixelCount,
        nonWhitePdfPixels,
        significantDifferenceRatio: significantDifferences / pixelCount,
      };
    },
    {
      htmlPngDataUrl: `data:image/png;base64,${htmlScreenshot.toString('base64')}`,
      pdfPngDataUrl,
    },
  ) as Promise<{
    meanDifference: number;
    nonWhitePdfPixels: number;
    significantDifferenceRatio: number;
  }>;
}
