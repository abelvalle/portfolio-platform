import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { CvExportService } from '../src/cv/cv-export.service';
import { CvVersionService } from '../src/cv/cv-version.service';
import { CvVersionsController } from '../src/cv/cv-versions.controller';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { MediaController } from '../src/media/media.controller';
import { MediaService } from '../src/media/media.service';
import { MediaStorageService } from '../src/media/media-storage.service';
import { PrismaService } from '../src/prisma/prisma.service';

const describeDb = process.env.RUN_DB_E2E === 'true' ? describe : describe.skip;

describeDb('CV version generated media download with PostgreSQL (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let storageRoot: string;
  let pdfPath: string;
  let mediaId: string | undefined;

  const runId = `db-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cvId = `${runId}-cv`;
  const templateId = `${runId}-template`;
  const versionId = `${runId}-version`;

  beforeAll(async () => {
    const storageDir = join('storage-test', runId);
    storageRoot = join(process.cwd(), storageDir);
    pdfPath = join(storageRoot, 'cv', `${versionId}.pdf`);
    mkdirSync(join(storageRoot, 'cv'), { recursive: true });
    writeFileSync(pdfPath, Buffer.from('%PDF-1.4 generated cv from db'));

    const exporter = {
      generatePdf: jest.fn().mockResolvedValue({
        filename: `${versionId}.pdf`,
        path: pdfPath,
        url: `/media/generated/${versionId}.pdf`,
      }),
      generateDocx: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CvVersionsController, MediaController],
      providers: [
        PrismaService,
        CvVersionService,
        MediaService,
        { provide: CvExportService, useValue: exporter },
        {
          provide: MediaStorageService,
          useValue: new MediaStorageService({
            get: jest.fn((key: string) =>
              key === 'STORAGE_DIR' ? storageDir : undefined,
            ),
          } as never),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => { getRequest: () => { user?: unknown } };
        }) => {
          context.switchToHttp().getRequest().user = {
            id: 'db-e2e-user',
            role: 'admin',
          };
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.cv.create({
      data: {
        id: cvId,
        slug: `${runId}-cv`,
        name: 'DB E2E CV',
        headline: 'IT Project Manager',
        summary: 'Contrato DB real para descarga CV.',
        contactJson: {},
        structuredJson: {},
      },
    });
    await prisma.cvTemplate.create({
      data: {
        id: templateId,
        name: 'DB E2E Template',
        slug: `${runId}-template`,
        config: { primaryColor: '#111827' },
      },
    });
    await prisma.cvVersion.create({
      data: {
        id: versionId,
        cvId,
        templateId,
        name: 'DB E2E Version',
        slug: `${runId}-version`,
        targetRole: 'IT Project Manager',
        structuredJson: {
          profile: { fullName: 'Abel Valle Rosa' },
          summary: 'Gestion IT, delivery, KPIs y UAT.',
        },
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.cvGeneratedFile.deleteMany({
        where: { cvVersionId: versionId },
      });
      await prisma.auditLog.deleteMany({ where: { resourceId: versionId } });
      await prisma.cvVersion.deleteMany({ where: { id: versionId } });
      await prisma.cvTemplate.deleteMany({ where: { id: templateId } });
      await prisma.cv.deleteMany({ where: { id: cvId } });
      if (mediaId) {
        await prisma.mediaAsset.deleteMany({ where: { id: mediaId } });
      }
    }
    await app?.close();
    rmSync(storageRoot, { recursive: true, force: true });
  });

  it('generates and downloads a CV file persisted in PostgreSQL', async () => {
    const generatedResponse = await request(app.getHttpServer())
      .post(`/cv-versions/${versionId}/generate-pdf`)
      .expect(201);

    mediaId = generatedResponse.body.media.id;
    expect(mediaId).toBeTruthy();

    const persistedMedia = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });
    const persistedFile = await prisma.cvGeneratedFile.findFirst({
      where: { cvVersionId: versionId, mediaAssetId: mediaId },
    });
    const updatedVersion = await prisma.cvVersion.findUnique({
      where: { id: versionId },
    });

    expect(persistedMedia).toEqual(
      expect.objectContaining({
        filename: `${versionId}.pdf`,
        mimeType: 'application/pdf',
        storageKey: pdfPath,
      }),
    );
    expect(persistedFile).toEqual(
      expect.objectContaining({ type: 'pdf', mediaAssetId: mediaId }),
    );
    expect(updatedVersion?.generatedPdfId).toBe(mediaId);

    const downloadResponse = await request(app.getHttpServer())
      .get(`/media/${mediaId}/download`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(downloadResponse.headers['content-type']).toContain(
      'application/pdf',
    );
    expect(downloadResponse.body.toString()).toBe(
      '%PDF-1.4 generated cv from db',
    );
  });
});

function binaryParser(
  response: NodeJS.ReadableStream,
  callback: (error: Error | null, body?: Buffer) => void,
) {
  const chunks: Buffer[] = [];
  response.on('data', (chunk) =>
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
  );
  response.on('error', (error) => callback(error));
  response.on('end', () => callback(null, Buffer.concat(chunks)));
}
