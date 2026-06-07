import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { ResourcesService } from '../src/resources/resources.service';
import { ThemeController } from '../src/resources/theme.controller';

describe('ThemeController (e2e)', () => {
  let app: INestApplication;
  let resourcesService: { updateTheme: jest.Mock; getTheme: jest.Mock };

  beforeEach(async () => {
    resourcesService = {
      getTheme: jest.fn(),
      updateTheme: jest.fn().mockImplementation((data) => ({
        id: 'theme-1',
        ...data,
      })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ThemeController],
      providers: [{ provide: ResourcesService, useValue: resourcesService }],
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

  it('updates theme settings with validated and sanitized payload', async () => {
    const response = await request(app.getHttpServer())
      .patch('/theme')
      .send({
        primaryColor: '#5eead4',
        backgroundColor: '#07090d',
        cardStyle: 'subtle',
        colorMode: 'dark',
        draftJson: { colorMode: 'dark' },
        unexpected: 'drop-me',
      })
      .expect(200);

    expect(resourcesService.updateTheme).toHaveBeenCalledWith({
      primaryColor: '#5eead4',
      backgroundColor: '#07090d',
      cardStyle: 'subtle',
      colorMode: 'dark',
      draftJson: { colorMode: 'dark' },
    });
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'theme-1',
        primaryColor: '#5eead4',
        colorMode: 'dark',
      }),
    );
    expect(response.body.unexpected).toBeUndefined();
  });

  it('rejects invalid theme tokens before update', async () => {
    await request(app.getHttpServer())
      .patch('/theme')
      .send({ primaryColor: 'teal' })
      .expect(400);

    expect(resourcesService.updateTheme).not.toHaveBeenCalled();
  });
});
