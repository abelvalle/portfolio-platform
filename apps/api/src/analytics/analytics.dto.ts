import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

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
