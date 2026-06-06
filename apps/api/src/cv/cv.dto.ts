import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCvDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  headline!: string;

  @ApiProperty()
  @IsString()
  summary!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  structuredJson?: Record<string, unknown>;
}

export class AdaptCvDto {
  @ApiProperty()
  @IsString()
  baseCvVersionId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetRoleId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  targetRole!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  targetCompany?: string;

  @ApiProperty()
  @IsString()
  @MinLength(40)
  jobDescription!: string;
}

export class CompareVersionsDto {
  @ApiProperty()
  @IsString()
  baseCvVersionId!: string;

  @ApiProperty()
  @IsString()
  adaptedCvVersionId!: string;
}

export class AtsRoleReportDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  targetRole?: string;

  @ApiProperty()
  @IsString()
  @MinLength(40)
  jobDescription!: string;
}

export class DownloadCvQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  template?: string;
}
