import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { UpdateThemeDto } from './theme.dto';

describe('UpdateThemeDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
  });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: UpdateThemeDto,
    data: '',
  };

  it('keeps known fields and strips unknown fields', async () => {
    const result = (await pipe.transform(
      {
        primaryColor: '#5eead4',
        cardStyle: 'subtle',
        draftJson: { colorMode: 'dark' },
        unexpected: 'drop-me',
      },
      metadata,
    )) as Record<string, unknown>;

    expect(result.primaryColor).toBe('#5eead4');
    expect(result.cardStyle).toBe('subtle');
    expect(result.draftJson).toEqual({ colorMode: 'dark' });
    expect(result.unexpected).toBeUndefined();
  });

  it('rejects invalid hex colors', async () => {
    await expect(
      pipe.transform({ primaryColor: 'teal' }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects null for non-null theme fields', async () => {
    await expect(
      pipe.transform({ colorMode: null }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
