import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const outputPath = resolve(process.cwd(), '..', '..', 'docs', 'openapi.json');

async function generateOpenApi() {
  let app: INestApplication | undefined;

  try {
    app = await NestFactory.create(AppModule, { logger: false });

    app.setGlobalPrefix('api/v1');

    const config = new DocumentBuilder()
      .setTitle('Portfolio Platform API')
      .setDescription(
        'REST API for Abel Valle Rosa portfolio, admin CMS, analytics and CV Manager.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    const formattedDocument = `${JSON.stringify(document, null, 2)}\n`;

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, formattedDocument, 'utf8');
  } finally {
    await app?.close();
  }
}

generateOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
