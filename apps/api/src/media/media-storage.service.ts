import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, type ReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import {
  basename,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from 'node:path';

export type UploadedMediaFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type StoredMediaFile = {
  filename: string;
  storageKey: string;
  url: string;
};

const EICAR_SIGNATURE =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!';

@Injectable()
export class MediaStorageService {
  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    return {
      provider: this.provider,
      storageDir: this.storageDir,
      maxFileSizeMb: this.maxFileSizeMb,
      quotaMb: this.quotaMb,
      allowedMimeTypes: this.allowedMimeTypes,
      signatureScanEnabled: this.signatureScanEnabled,
      externalScanEnabled: this.externalScanEnabled,
      externalScanConfigured: Boolean(this.externalScanUrl),
      uploadEndpoint: '/api/v1/media/upload',
      downloadPattern: '/api/v1/media/:id/download',
    };
  }

  async save(file: UploadedMediaFile): Promise<StoredMediaFile> {
    this.assertLocalProvider();
    this.validateFile(file);
    await this.scanWithExternalProvider(file);

    const uploadDir = join(this.storageRoot, 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filename = this.buildFilename(file.originalname, file.mimetype);
    const storageKey = join(uploadDir, filename);
    await writeFile(storageKey, file.buffer);

    return {
      filename,
      storageKey,
      url: `/media/uploads/${filename}`,
    };
  }

  async testExternalScan() {
    if (!this.externalScanEnabled || !this.externalScanUrl) {
      return { configured: false, scanned: false, clean: null };
    }

    try {
      await this.scanWithExternalProvider({
        originalname: 'media-scan-test.pdf',
        mimetype: 'application/pdf',
        size: 15,
        buffer: Buffer.from('media scan test'),
      });
      return { configured: true, scanned: true, clean: true };
    } catch (error) {
      return {
        configured: true,
        scanned: true,
        clean: false,
        error: errorMessage(error),
      };
    }
  }

  async createReadStream(storageKey?: string | null): Promise<ReadStream> {
    this.assertLocalProvider();
    if (!storageKey) {
      throw new NotFoundException('Media file is not available');
    }

    const target = resolve(storageKey);
    const root = resolve(this.storageRoot);
    const relativePath = relative(root, target);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new BadRequestException('Media file is outside configured storage');
    }

    try {
      await access(target);
    } catch {
      throw new NotFoundException('Media file is not available');
    }

    return createReadStream(target);
  }

  async deleteLocalFile(storageKey?: string | null) {
    this.assertLocalProvider();
    const key = storageKey?.trim();
    if (!key) {
      return false;
    }

    const target = resolve(key);
    const root = resolve(this.storageRoot);
    const relativePath = relative(root, target);
    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new BadRequestException('Media file is outside configured storage');
    }

    try {
      await access(target);
    } catch {
      return false;
    }

    await unlink(target);
    return true;
  }

  private validateFile(file: UploadedMediaFile) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported media type ${file.mimetype}`);
    }
    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(`File exceeds ${this.maxFileSizeMb} MB`);
    }
    if (this.signatureScanEnabled && file.buffer.includes(EICAR_SIGNATURE)) {
      throw new BadRequestException('File failed malware signature scan');
    }
  }

  private async scanWithExternalProvider(file: UploadedMediaFile) {
    if (!this.externalScanEnabled || !this.externalScanUrl) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.externalScanTimeoutMs,
    );

    try {
      const response = await fetch(this.externalScanUrl, {
        method: 'POST',
        headers: this.externalScanHeaders,
        body: JSON.stringify({
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          sha256: createHash('sha256').update(file.buffer).digest('hex'),
          contentBase64: file.buffer.toString('base64'),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BadRequestException('External malware scan failed');
      }

      const result = (await response.json().catch(() => null)) as {
        clean?: boolean;
        verdict?: string;
        status?: string;
      } | null;

      if (!this.isCleanExternalScan(result)) {
        throw new BadRequestException('File rejected by external malware scan');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('External malware scan failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  private isCleanExternalScan(
    result: { clean?: boolean; verdict?: string; status?: string } | null,
  ) {
    return (
      result?.clean === true ||
      result?.verdict?.toLowerCase() === 'clean' ||
      result?.status?.toLowerCase() === 'clean'
    );
  }

  private buildFilename(originalName: string, mimeType: string) {
    const ext = extname(originalName) || this.extensionForMimeType(mimeType);
    const base = basename(originalName || 'file', ext)
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    return `${base || 'file'}-${Date.now()}-${randomUUID()}${ext}`;
  }

  private extensionForMimeType(mimeType: string) {
    const extensions: Record<string, string> = {
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    return extensions[mimeType] || '';
  }

  private assertLocalProvider() {
    if (this.provider !== 'local') {
      throw new BadRequestException('Only local media storage is implemented');
    }
  }

  private get provider() {
    return this.configService.get<string>('MEDIA_STORAGE_PROVIDER') || 'local';
  }

  private get storageDir() {
    return this.configService.get<string>('STORAGE_DIR') || 'storage';
  }

  private get storageRoot() {
    return join(process.cwd(), this.storageDir);
  }

  private get maxFileSizeMb() {
    const configured = Number(
      this.configService.get<string>('MEDIA_MAX_FILE_SIZE_MB') || 10,
    );
    return Number.isFinite(configured) && configured > 0 ? configured : 10;
  }

  private get maxFileSizeBytes() {
    return this.maxFileSizeMb * 1024 * 1024;
  }

  private get quotaMb() {
    const configured = Number(
      this.configService.get<string>('MEDIA_STORAGE_QUOTA_MB') || 0,
    );
    return Number.isFinite(configured) && configured > 0 ? configured : null;
  }

  private get signatureScanEnabled() {
    return (
      this.configService.get<string>('MEDIA_SIGNATURE_SCAN_ENABLED') !== 'false'
    );
  }

  private get externalScanEnabled() {
    return (
      this.configService.get<string>('MEDIA_EXTERNAL_SCAN_ENABLED') !==
        'false' && Boolean(this.externalScanUrl)
    );
  }

  private get externalScanUrl() {
    return this.configService.get<string>('MEDIA_EXTERNAL_SCAN_URL') || null;
  }

  private get externalScanHeaders() {
    const apiKey = this.configService.get<string>(
      'MEDIA_EXTERNAL_SCAN_API_KEY',
    );
    return {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    };
  }

  private get externalScanTimeoutMs() {
    const configured = Number(
      this.configService.get<string>('MEDIA_EXTERNAL_SCAN_TIMEOUT_MS') || 5000,
    );
    if (!Number.isFinite(configured)) {
      return 5000;
    }
    return Math.max(1000, Math.min(30000, configured));
  }

  private get allowedMimeTypes() {
    const configured = this.configService.get<string>(
      'MEDIA_ALLOWED_MIME_TYPES',
    );
    const configuredMimeTypes = configured
      ?.split(',')
      .map((mimeType) => mimeType.trim())
      .filter(Boolean);

    return configuredMimeTypes?.length
      ? configuredMimeTypes
      : [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/webp',
        ];
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'unknown error';
}
