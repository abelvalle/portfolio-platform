import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import type { Request, Response } from 'express';
import { AnalyticsService } from '../analytics/analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import {
  AdaptCvDto,
  AtsRoleReportDto,
  CompareVersionsDto,
  CreateCvDto,
  DownloadCvQueryDto,
} from './cv.dto';
import { CvAdaptationService } from './cv-adaptation.service';
import { CvService } from './cv.service';

@ApiTags('cv')
@Controller('cv')
export class CvController {
  constructor(
    private readonly cvService: CvService,
    private readonly adaptationService: CvAdaptationService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get()
  getPrimary() {
    return this.cvService.getPrimary();
  }

  @Get('download')
  async downloadPrimaryPdf(
    @Query() query: DownloadCvQueryDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.cvService.generatePublicPdf(query.template);
    void this.analyticsService
      .record(
        {
          type: 'cv_download',
          label: query.template || 'primary_cv',
          path: query.template
            ? `/cv/download?template=${query.template}`
            : '/cv/download',
        },
        request.ip,
        request.headers['user-agent'],
      )
      .catch(() => undefined);
    response.setHeader('Content-Type', result.download.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.download.filename.replace(/"/g, '')}"`,
    );
    return new StreamableFile(createReadStream(result.download.storageKey));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cvService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post()
  create(@Body() body: CreateCvDto) {
    return this.cvService.create(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.cvService.update(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cvService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post('import')
  import(@Body('rawText') rawText: string) {
    return this.cvService.importFromText(rawText || '');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post(':id/generate-pdf')
  generatePdf(@Param('id') id: string) {
    return this.cvService.generatePdf(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post(':id/generate-docx')
  generateDocx(@Param('id') id: string) {
    return this.cvService.generateDocx(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Get(':id/ats-report')
  getAtsReport(@Param('id') id: string) {
    return this.cvService.getAtsReport(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post(':id/ats-role-report')
  getAtsRoleReport(@Param('id') id: string, @Body() body: AtsRoleReportDto) {
    return this.cvService.getAtsRoleReport(
      id,
      body.jobDescription,
      body.targetRole,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post(':id/generate-ats-pdf')
  generateAtsPdf(@Param('id') id: string) {
    return this.cvService.generateAtsPdf(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post(':id/generate-ats-docx')
  generateAtsDocx(@Param('id') id: string) {
    return this.cvService.generateAtsDocx(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post(':id/set-primary')
  setPrimary(@Param('id') id: string) {
    return this.cvService.setPrimary(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post('adapt-to-role')
  async adapt(@Body() body: AdaptCvDto, @Req() request: Request) {
    const result = await this.adaptationService.adapt(body);
    void this.analyticsService
      .record(
        {
          type: 'cv_adaptation',
          label: body.targetRole,
          path: body.targetRoleId
            ? `/cv/adapt-to-role?targetRoleId=${body.targetRoleId}`
            : '/cv/adapt-to-role',
        },
        request.ip,
        request.headers['user-agent'],
      )
      .catch(() => undefined);
    return result;
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post('compare-versions')
  compare(@Body() body: CompareVersionsDto) {
    return this.adaptationService.compare(body);
  }
}
