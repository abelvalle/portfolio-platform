import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class TranslationQueryDto {
  @ApiProperty({ required: false, example: 'en' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/)
  locale?: string;

  @ApiProperty({ required: false, example: 'public.hero' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  namespace?: string;

  @ApiProperty({ required: false, example: 'true' })
  @IsOptional()
  @IsString()
  includeHidden?: string;
}

export class UpsertTranslationDto {
  @ApiProperty({ example: 'en' })
  @IsString()
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/)
  locale!: string;

  @ApiProperty({ example: 'public.hero' })
  @IsString()
  @Matches(/^[a-z0-9_.-]{1,80}$/)
  namespace!: string;

  @ApiProperty({ example: 'downloadCv' })
  @IsString()
  @Matches(/^[a-zA-Z0-9_.-]{1,120}$/)
  key!: string;

  @ApiProperty({ example: 'Download resume' })
  @IsString()
  @MaxLength(4000)
  value!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateTranslationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  value?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}
