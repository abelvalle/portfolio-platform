import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateContactWebhookSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiProperty({ required: false, example: 'https://example.com/webhook' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  url?: string;

  @ApiProperty({ required: false, example: 'contact.message.created' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_.-]{1,120}$/)
  event?: string;

  @ApiProperty({ required: false, example: 'contact.webhook.test' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_.-]{1,120}$/)
  testEvent?: string;

  @ApiProperty({ required: false, minimum: 1000, maximum: 30000 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  timeoutMs?: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  retryAttempts?: number;

  @ApiProperty({ required: false, minimum: 1000, maximum: 300000 })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(300000)
  retryDelayMs?: number;
}
