import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMediaAssetDto {
  @IsString()
  @MaxLength(180)
  filename!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  originalName?: string;

  @IsString()
  @MaxLength(120)
  mimeType!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @IsString()
  @MaxLength(500)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storageKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateMediaAssetDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  filename?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  originalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storageKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UploadMediaDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;
}

export class PurgeDeletedMediaDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3650)
  retentionDays?: number;

  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
