import { StreamableFile } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CvController } from './cv.controller';

describe('CvController downloads', () => {
  it('tracks public CV downloads server-side', async () => {
    const storageDir = join(process.cwd(), `storage-test-${Date.now()}`);
    const storageKey = join(storageDir, 'cv.pdf');
    await mkdir(storageDir, { recursive: true });
    await writeFile(storageKey, Buffer.from('pdf'));

    try {
      const cvService = {
        generatePublicPdf: jest.fn().mockResolvedValue({
          download: {
            filename: 'cv.pdf',
            mimeType: 'application/pdf',
            storageKey,
          },
        }),
      };
      const analyticsService = {
        record: jest.fn().mockResolvedValue({ id: 'event-1' }),
      };
      const controller = new CvController(
        cvService as never,
        {} as never,
        analyticsService as never,
      );
      const response = { setHeader: jest.fn() };

      const result = await controller.downloadPrimaryPdf(
        { template: 'ats-friendly' },
        {
          ip: '127.0.0.1',
          headers: { 'user-agent': 'ua' },
        } as never,
        response as never,
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(response.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(analyticsService.record).toHaveBeenCalledWith(
        {
          type: 'cv_download',
          label: 'ats-friendly',
          path: '/cv/download?template=ats-friendly',
        },
        '127.0.0.1',
        'ua',
      );
    } finally {
      await rm(storageDir, { recursive: true, force: true });
    }
  });
});

describe('CvController adaptations', () => {
  it('tracks CV adaptation requests server-side', async () => {
    const adaptationService = {
      adapt: jest.fn().mockResolvedValue({
        request: { id: 'adaptation-1' },
        proposed: { summary: 'Adapted' },
      }),
    };
    const analyticsService = {
      record: jest.fn().mockResolvedValue({ id: 'event-1' }),
    };
    const controller = new CvController(
      {} as never,
      adaptationService as never,
      analyticsService as never,
    );

    const result = await controller.adapt(
      {
        baseCvVersionId: 'cv-base',
        targetRoleId: 'target-role-1',
        targetRole: 'Delivery Manager',
        jobDescription:
          'Buscamos Delivery Manager con KPIs, UAT, stakeholders y reporting.',
      },
      {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'ua' },
      } as never,
    );

    expect(result.request.id).toBe('adaptation-1');
    expect(analyticsService.record).toHaveBeenCalledWith(
      {
        type: 'cv_adaptation',
        label: 'Delivery Manager',
        path: '/cv/adapt-to-role?targetRoleId=target-role-1',
      },
      '127.0.0.1',
      'ua',
    );
  });
});
