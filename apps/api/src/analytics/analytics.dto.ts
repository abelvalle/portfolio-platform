import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAnalyticsEventDto {
  @ApiProperty({ example: 'landing_visit' })
  @IsString()
  @MaxLength(80)
  type!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  path?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  label?: string;

  @ApiProperty({ required: false, example: 'linkedin' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @ApiProperty({ required: false, example: 'referral' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  channel?: string;
}

export class AnalyticsDateRangeQueryDto {
  @ApiProperty({ required: false, example: '2026-06-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;

  @ApiProperty({ required: false, example: '2026-06-30' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

export class AnalyticsEventsQueryDto extends AnalyticsDateRangeQueryDto {
  @ApiProperty({ required: false, example: 'cv_download' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  type?: string;
}

export class AnalyticsFunnelQueryDto extends AnalyticsDateRangeQueryDto {
  @ApiProperty({
    required: false,
    example: 'landing_visit,project_view,contact_submit',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  steps?: string;
}

export class CreateAnalyticsFunnelDefinitionDto {
  @ApiProperty({ example: 'landing-project-contact' })
  @IsString()
  @Matches(/^[a-z0-9-]{1,80}$/)
  key!: string;

  @ApiProperty({ example: 'Landing -> Proyecto -> Contacto' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({
    example: ['landing_visit', 'project_view', 'contact_submit'],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]{1,80}$/, { each: true })
  steps!: string[];

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateAnalyticsFunnelDefinitionDto {
  @ApiProperty({ required: false, example: 'Landing -> Proyecto -> Contacto' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({
    required: false,
    example: ['landing_visit', 'project_view', 'contact_submit'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]{1,80}$/, { each: true })
  steps?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
