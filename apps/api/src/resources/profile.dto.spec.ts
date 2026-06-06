import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateProfileDto } from './profile.dto';

describe('UpdateProfileDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: UpdateProfileDto,
    data: '',
  };

  it('keeps known fields and strips unknown fields', async () => {
    const result = (await pipe.transform(
      {
        fullName: 'Abel Valle Rosa',
        phone: null,
        draftJson: { headline: 'IT Project Manager' },
        unexpected: 'drop-me',
      },
      metadata,
    )) as Record<string, unknown>;

    expect(result.fullName).toBe('Abel Valle Rosa');
    expect(result.phone).toBeNull();
    expect(result.draftJson).toEqual({ headline: 'IT Project Manager' });
    expect(result.unexpected).toBeUndefined();
  });

  it('rejects invalid email format', async () => {
    await expect(
      pipe.transform({ email: 'not-an-email' }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects null for non-null profile fields', async () => {
    await expect(
      pipe.transform({ fullName: null }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
