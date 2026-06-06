import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MediaStorageService } from './media-storage.service';

describe('MediaStorageService', () => {
  it('reports local storage defaults', () => {
    const service = new MediaStorageService(mockConfig());

    expect(service.getStatus()).toMatchObject({
      provider: 'local',
      storageDir: 'storage',
      maxFileSizeMb: 10,
      quotaMb: null,
      uploadEndpoint: '/api/v1/media/upload',
    });
  });

  it('reports optional storage quota', () => {
    const service = new MediaStorageService(
      mockConfig({ MEDIA_STORAGE_QUOTA_MB: '250' }),
    );

    expect(service.getStatus()).toMatchObject({ quotaMb: 250 });
  });

  it('rejects unsupported media types before writing files', async () => {
    const service = new MediaStorageService(mockConfig());

    await expect(
      service.save({
        originalname: 'notes.txt',
        mimetype: 'text/plain',
        size: 10,
        buffer: Buffer.from('hello'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes local files inside the configured storage directory', async () => {
    const storageDir = `storage-test-${Date.now()}`;
    const uploadDir = join(process.cwd(), storageDir, 'uploads');
    const target = join(uploadDir, 'demo.pdf');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(target, Buffer.from('pdf'));

    try {
      const service = new MediaStorageService(
        mockConfig({ STORAGE_DIR: storageDir }),
      );

      await expect(service.deleteLocalFile(target)).resolves.toBe(true);
      await expect(access(target)).rejects.toThrow();
    } finally {
      await rm(join(process.cwd(), storageDir), {
        recursive: true,
        force: true,
      });
    }
  });
});

function mockConfig(values: Record<string, string> = {}) {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}
