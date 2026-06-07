import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './common/config/cors.config';
import { assertSafeProductionSecrets } from './common/config/production-secrets';
import { isSwaggerEnabled } from './common/config/swagger.config';
import { securityHeadersMiddleware } from './common/security/security-headers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsOrigins = parseCorsOrigins(
    configService.get<string>('API_CORS_ORIGIN'),
  );
  const nodeEnv = configService.get<string>('NODE_ENV');

  assertSafeProductionSecrets(nodeEnv, (key) => configService.get<string>(key));

  app.setGlobalPrefix('api/v1');
  app.use(securityHeadersMiddleware);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  if (
    isSwaggerEnabled(nodeEnv, configService.get<string>('API_SWAGGER_ENABLED'))
  ) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Portfolio Platform API')
      .setDescription(
        'REST API for Abel Valle Rosa portfolio, admin CMS, analytics and CV Manager.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(configService.get<number>('PORT') ?? 4000);
}
void bootstrap();
