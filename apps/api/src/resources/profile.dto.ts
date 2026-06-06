import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(160)
  fullName?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(180)
  headline?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(240)
  subtitle?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(1200)
  shortBio?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(5000)
  longBio?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(160)
  location?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(160)
  availability?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsEmail()
  @MaxLength(180)
  email?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkedin?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  github?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  website?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cvUrl?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  seoTitle?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDescription?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageUrl?: string | null;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(16)
  primaryLanguage?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(80)
  ctaPrimary?: string;

  @ApiProperty({ required: false })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(80)
  ctaSecondary?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsObject()
  draftJson?: Record<string, unknown> | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsISO8601()
  publishedAt?: string | null;
}

function RequiredWhenPresent() {
  return ValidateIf((_object, value) => value !== undefined);
}
