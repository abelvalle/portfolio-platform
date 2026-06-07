import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { TranslationsController } from '../src/translations/translations.controller';
import { TranslationsService } from '../src/translations/translations.service';

describe('TranslationsController (e2e)', () => {
  let app: INestApplication;
  let translationsService: {
    dictionary: jest.Mock;
    list: jest.Mock;
    remove: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
  };

  beforeEach(async () => {
    translationsService = {
      dictionary: jest.fn().mockResolvedValue({
        hero: { downloadCv: 'Download resume' },
      }),
      list: jest.fn().mockResolvedValue([
        {
          id: 'translation-1',
          locale: 'en',
          namespace: 'public.hero',
          key: 'downloadCv',
          value: 'Download resume',
          visible: true,
        },
      ]),
      remove: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn().mockImplementation((data) => ({
        id: 'translation-1',
        ...data,
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TranslationsController],
      providers: [
        { provide: TranslationsService, useValue: translationsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns public visible translations with forced public mode', async () => {
    const response = await request(app.getHttpServer())
      .get('/translations/public?locale=en&namespace=public.hero')
      .expect(200);

    expect(translationsService.list).toHaveBeenCalledWith(
      { locale: 'en', namespace: 'public.hero' },
      true,
    );
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        key: 'downloadCv',
        value: 'Download resume',
      }),
    );
  });

  it('returns public translation dictionary with forced public mode', async () => {
    const response = await request(app.getHttpServer())
      .get('/translations/public/dictionary?locale=en')
      .expect(200);

    expect(translationsService.dictionary).toHaveBeenCalledWith(
      { locale: 'en' },
      true,
    );
    expect(response.body).toEqual({
      hero: { downloadCv: 'Download resume' },
    });
  });

  it('upserts admin translations with a validated and sanitized payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/translations')
      .send({
        locale: 'en',
        namespace: 'public.hero',
        key: 'downloadCv',
        value: 'Download resume',
        description: 'Hero CTA',
        visible: true,
        unexpected: 'drop-me',
      })
      .expect(201);

    expect(translationsService.upsert).toHaveBeenCalledWith({
      locale: 'en',
      namespace: 'public.hero',
      key: 'downloadCv',
      value: 'Download resume',
      description: 'Hero CTA',
      visible: true,
    });
    expect(response.body.unexpected).toBeUndefined();
  });

  it('rejects invalid locales before upsert', async () => {
    await request(app.getHttpServer())
      .post('/translations')
      .send({
        locale: 'english',
        namespace: 'public.hero',
        key: 'downloadCv',
        value: 'Download resume',
      })
      .expect(400);

    expect(translationsService.upsert).not.toHaveBeenCalled();
  });
});
