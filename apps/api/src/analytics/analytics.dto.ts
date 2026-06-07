import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
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

const analyticsGoalPeriods = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'custom',
];

export class CreateAnalyticsGoalDto {
  @ApiProperty({ example: 'monthly-cv-downloads' })
  @IsString()
  @Matches(/^[a-z0-9-]{1,80}$/)
  key!: string;

  @ApiProperty({ example: 'Descargas CV mensuales' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ example: 'cv_download' })
  @IsString()
  @Matches(/^[a-z0-9_-]{1,80}$/)
  eventType!: string;

  @ApiProperty({
    required: false,
    example: ['project_view', 'cv_download', 'contact_submit'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]{1,80}$/, { each: true })
  eventTypes?: string[];

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  targetCount!: number;

  @ApiProperty({ required: false, default: 'monthly' })
  @IsOptional()
  @IsString()
  @IsIn(analyticsGoalPeriods)
  period?: string;

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

export class UpdateAnalyticsGoalDto {
  @ApiProperty({ required: false, example: 'Descargas CV mensuales' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ required: false, example: 'cv_download' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9_-]{1,80}$/)
  eventType?: string;

  @ApiProperty({
    required: false,
    example: ['project_view', 'cv_download', 'contact_submit'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Matches(/^[a-z0-9_-]{1,80}$/, { each: true })
  eventTypes?: string[];

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  targetCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsIn(analyticsGoalPeriods)
  period?: string;

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
