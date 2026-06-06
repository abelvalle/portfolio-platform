import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { CvVersionService } from '../src/cv/cv-version.service';
import { CvVersionsController } from '../src/cv/cv-versions.controller';
import { CvExportService } from '../src/cv/cv-export.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { MediaController } from '../src/media/media.controller';
import { MediaService } from '../src/media/media.service';
import { MediaStorageService } from '../src/media/media-storage.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CV version generated media download (e2e)', () => {
  let app: INestApplication;
  let storageRoot: string;
  let pdfPath: string;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    const storageDir = join(
      'storage-test',
      `cv-version-http-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    storageRoot = join(process.cwd(), storageDir);
    pdfPath = join(storageRoot, 'cv', 'version-1.pdf');
    mkdirSync(join(storageRoot, 'cv'), { recursive: true });
    writeFileSync(pdfPath, Buffer.from('%PDF-1.4 generated cv over http'));

    prisma = createPrismaMock();
    const exporter = {
      generatePdf: jest.fn().mockResolvedValue({
        filename: 'version-1.pdf',
        path: pdfPath,
        url: '/media/generated/version-1.pdf',
      }),
      generateDocx: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CvVersionsController, MediaController],
      providers: [
        CvVersionService,
        MediaService,
        { provide: PrismaService, useValue: prisma },
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
            id: 'user-1',
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
  });

  afterEach(async () => {
    await app.close();
    rmSync(storageRoot, { recursive: true, force: true });
  });

  it('generates a persisted PDF media asset and downloads it over HTTP', async () => {
    const generatedResponse = await request(app.getHttpServer())
      .post('/cv-versions/version-1/generate-pdf')
      .expect(201);

    expect(generatedResponse.body.media).toEqual(
      expect.objectContaining({
        id: 'media-generated-pdf',
        filename: 'version-1.pdf',
        mimeType: 'application/pdf',
        storageKey: pdfPath,
      }),
    );
    expect(prisma.cvGeneratedFile.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cvVersionId: 'version-1',
        mediaAssetId: 'media-generated-pdf',
        type: 'pdf',
      }),
    });

    const downloadResponse = await request(app.getHttpServer())
      .get('/media/media-generated-pdf/download')
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(downloadResponse.headers['content-type']).toContain(
      'application/pdf',
    );
    expect(downloadResponse.headers['content-disposition']).toContain(
      'version-1.pdf',
    );
    expect(downloadResponse.body.toString()).toBe(
      '%PDF-1.4 generated cv over http',
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

function createPrismaMock() {
  let persistedMedia: Record<string, unknown> | null = null;

  return {
    cvVersion: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'version-1',
        cvId: 'cv-1',
        status: 'draft',
        deletedAt: null,
        structuredJson: {
          profile: { fullName: 'Abel Valle Rosa' },
          summary: 'Gestion IT, delivery, KPIs y UAT.',
        },
        template: {
          name: 'ATS-friendly',
          slug: 'ats-friendly',
          config: { primaryColor: '#111827' },
        },
      }),
      update: jest.fn().mockResolvedValue({
        id: 'version-1',
        generatedPdfId: 'media-generated-pdf',
      }),
    },
    mediaAsset: {
      create: jest.fn().mockImplementation(({ data }) => {
        persistedMedia = {
          id: 'media-generated-pdf',
          deletedAt: null,
          ...data,
        };
        return Promise.resolve(persistedMedia);
      }),
      findUnique: jest
        .fn()
        .mockImplementation(({ where }) =>
          Promise.resolve(
            where.id === 'media-generated-pdf' ? persistedMedia : null,
          ),
        ),
    },
    cvGeneratedFile: {
      create: jest.fn().mockResolvedValue({
        id: 'generated-1',
        cvVersionId: 'version-1',
        mediaAssetId: 'media-generated-pdf',
        type: 'pdf',
      }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    },
  };
}
