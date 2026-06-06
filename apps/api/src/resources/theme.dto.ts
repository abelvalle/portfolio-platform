import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export class UpdateThemeDto {
  @ApiProperty({ required: false, example: '#5eead4' })
  @RequiredWhenPresent()
  @Matches(HEX_COLOR)
  primaryColor?: string;

  @ApiProperty({ required: false, example: '#94a3b8' })
  @RequiredWhenPresent()
  @Matches(HEX_COLOR)
  secondaryColor?: string;

  @ApiProperty({ required: false, example: '#07090d' })
  @RequiredWhenPresent()
  @Matches(HEX_COLOR)
  backgroundColor?: string;

  @ApiProperty({ required: false, example: '#f8fafc' })
  @RequiredWhenPresent()
  @Matches(HEX_COLOR)
  textColor?: string;

  @ApiProperty({ required: false, example: 'Inter' })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(120)
  fontFamily?: string;

  @ApiProperty({ required: false, example: '8px' })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(40)
  borderRadius?: string;

  @ApiProperty({ required: false, enum: ['subtle', 'solid', 'outline'] })
  @RequiredWhenPresent()
  @IsIn(['subtle', 'solid', 'outline'])
  cardStyle?: string;

  @ApiProperty({ required: false, example: '60' })
  @RequiredWhenPresent()
  @IsString()
  @MaxLength(16)
  animationIntensity?: string;

  @ApiProperty({ required: false, enum: ['dark', 'light'] })
  @RequiredWhenPresent()
  @IsIn(['dark', 'light'])
  colorMode?: string;

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
