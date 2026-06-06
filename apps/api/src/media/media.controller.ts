import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  CreateMediaAssetDto,
  PurgeDeletedMediaDto,
  UpdateMediaAssetDto,
  UploadMediaDto,
} from './media.dto';
import { MediaService } from './media.service';
import type { UploadedMediaFile } from './media-storage.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  list() {
    return this.mediaService.list();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Get('storage/status')
  storageStatus() {
    return this.mediaService.storageStatus();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Post('storage/purge-deleted')
  purgeDeleted(
    @Body() body: PurgeDeletedMediaDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.mediaService.purgeDeleted(body, user?.id);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { asset, stream } = await this.mediaService.download(id);
    const filename = (asset.originalName || asset.filename).replace(/"/g, '');
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    return new StreamableFile(stream);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
        type: { type: 'string' },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  upload(
    @UploadedFile() file: UploadedMediaFile,
    @Body() body: UploadMediaDto,
    @CurrentUser() user: { id?: string },
  ) {
    return this.mediaService.upload(file, body, user?.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post()
  create(@Body() body: CreateMediaAssetDto) {
    return this.mediaService.create(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateMediaAssetDto) {
    return this.mediaService.update(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.mediaService.remove(id, user?.id);
  }
}
