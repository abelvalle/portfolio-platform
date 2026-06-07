import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MediaStorageService } from './media-storage.service';

const originalFetch = global.fetch;

describe('MediaStorageService', () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('reports local storage defaults', () => {
    const service = new MediaStorageService(mockConfig());

    expect(service.getStatus()).toMatchObject({
      provider: 'local',
      storageDir: 'storage',
      maxFileSizeMb: 10,
      quotaMb: null,
      signatureScanEnabled: true,
      externalScanEnabled: false,
      externalScanConfigured: false,
      uploadEndpoint: '/api/v1/media/upload',
    });
  });

  it('reports optional storage quota', () => {
    const service = new MediaStorageService(
      mockConfig({ MEDIA_STORAGE_QUOTA_MB: '250' }),
    );

    expect(service.getStatus()).toMatchObject({ quotaMb: 250 });
  });

  it('fails downloads explicitly when the configured provider is not implemented', async () => {
    const service = new MediaStorageService(
      mockConfig({ MEDIA_STORAGE_PROVIDER: 's3' }),
    );

    await expect(service.createReadStream('remote/key.pdf')).rejects.toThrow(
      'Only local media storage is implemented',
    );
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

  it('rejects EICAR test signature before writing files', async () => {
    const service = new MediaStorageService(mockConfig());
    const buffer = Buffer.from(
      'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
    );

    await expect(
      service.save({
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: buffer.length,
        buffer,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends uploads to the configured external malware scanner before writing', async () => {
    const storageDir = `storage-test-${Date.now()}`;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ clean: true }),
    });
    global.fetch = fetchMock as never;

    try {
      const service = new MediaStorageService(
        mockConfig({
          STORAGE_DIR: storageDir,
          MEDIA_EXTERNAL_SCAN_URL: 'https://scanner.example.com/scan',
          MEDIA_EXTERNAL_SCAN_API_KEY: 'scan-key',
        }),
      );
      const file = {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 3,
        buffer: Buffer.from('pdf'),
      };

      const stored = await service.save(file);

      expect(stored.filename).toContain('cv-');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://scanner.example.com/scan',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer scan-key',
          },
        }),
      );
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body).toEqual(
        expect.objectContaining({
          filename: 'cv.pdf',
          mimeType: 'application/pdf',
          size: 3,
          contentBase64: Buffer.from('pdf').toString('base64'),
        }),
      );
      expect(body.sha256).toHaveLength(64);
    } finally {
      await rm(join(process.cwd(), storageDir), {
        recursive: true,
        force: true,
      });
    }
  });

  it('rejects uploads when the external malware scanner reports a threat', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ clean: false }),
    });
    global.fetch = fetchMock as never;
    const service = new MediaStorageService(
      mockConfig({
        MEDIA_EXTERNAL_SCAN_URL: 'https://scanner.example.com/scan',
      }),
    );

    await expect(
      service.save({
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 3,
        buffer: Buffer.from('pdf'),
      }),
    ).rejects.toThrow('File rejected by external malware scan');
  });

  it('reports external scan tests as skipped when no scanner is configured', async () => {
    const service = new MediaStorageService(mockConfig());

    await expect(service.testExternalScan()).resolves.toEqual({
      configured: false,
      scanned: false,
      clean: null,
    });
  });

  it('runs a synthetic external scan test without writing files', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ verdict: 'clean' }),
    });
    global.fetch = fetchMock as never;
    const service = new MediaStorageService(
      mockConfig({
        MEDIA_EXTERNAL_SCAN_URL: 'https://scanner.example.com/scan',
      }),
    );

    await expect(service.testExternalScan()).resolves.toEqual({
      configured: true,
      scanned: true,
      clean: true,
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.filename).toBe('media-scan-test.pdf');
    expect(body.contentBase64).toBe(
      Buffer.from('media scan test').toString('base64'),
    );
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
