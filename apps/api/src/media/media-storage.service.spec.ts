import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaStorageService } from './media-storage.service';

describe('MediaStorageService', () => {
  it('reports local storage defaults', () => {
    const service = new MediaStorageService(mockConfig());

    expect(service.getStatus()).toMatchObject({
      provider: 'local',
      storageDir: 'storage',
      maxFileSizeMb: 10,
      uploadEndpoint: '/api/v1/media/upload',
    });
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
});

function mockConfig(values: Record<string, string> = {}) {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}
