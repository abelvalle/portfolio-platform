import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import {
  TranslationQueryDto,
  UpdateTranslationDto,
  UpsertTranslationDto,
} from './translations.dto';
import { TranslationsService } from './translations.service';

@ApiTags('translations')
@Controller('translations')
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get('public')
  publicList(@Query() query: TranslationQueryDto) {
    return this.translationsService.list(query, true);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_settings')
  @Get()
  list(@Query() query: TranslationQueryDto) {
    return this.translationsService.list(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_settings')
  @Post()
  upsert(@Body() body: UpsertTranslationDto) {
    return this.translationsService.upsert(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_settings')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateTranslationDto) {
    return this.translationsService.update(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_settings')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.translationsService.remove(id);
  }
}
