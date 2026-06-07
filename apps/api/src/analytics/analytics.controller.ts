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
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsDateRangeQueryDto,
  AnalyticsEventsQueryDto,
  AnalyticsFunnelQueryDto,
  CreateAnalyticsFunnelDefinitionDto,
  CreateAnalyticsEventDto,
  UpdateAnalyticsFunnelDefinitionDto,
} from './analytics.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  record(@Body() body: CreateAnalyticsEventDto, @Req() request: Request) {
    return this.analyticsService.record(
      body,
      request.ip,
      request.headers['user-agent'],
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('summary')
  summary(@Query() query: AnalyticsDateRangeQueryDto) {
    return this.analyticsService.summary(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('privacy')
  privacyStatus() {
    return this.analyticsService.privacyStatus();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('timeseries')
  timeSeries(@Query() query: AnalyticsEventsQueryDto) {
    return this.analyticsService.timeSeries(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('channels')
  channels(@Query() query: AnalyticsEventsQueryDto) {
    return this.analyticsService.channels(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('labels')
  labels(@Query() query: AnalyticsEventsQueryDto) {
    return this.analyticsService.labels(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('funnel/channels')
  channelFunnel(@Query() query: AnalyticsDateRangeQueryDto) {
    return this.analyticsService.channelFunnel(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('funnel')
  funnel(@Query() query: AnalyticsFunnelQueryDto) {
    return this.analyticsService.funnel(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('funnel-definitions')
  funnelDefinitions(@Query('includeHidden') includeHidden?: string) {
    return this.analyticsService.funnelDefinitions(includeHidden === 'true');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_analytics')
  @Post('funnel-definitions')
  createFunnelDefinition(@Body() body: CreateAnalyticsFunnelDefinitionDto) {
    return this.analyticsService.createFunnelDefinition(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_analytics')
  @Patch('funnel-definitions/:id')
  updateFunnelDefinition(
    @Param('id') id: string,
    @Body() body: UpdateAnalyticsFunnelDefinitionDto,
  ) {
    return this.analyticsService.updateFunnelDefinition(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_analytics')
  @Delete('funnel-definitions/:id')
  removeFunnelDefinition(@Param('id') id: string) {
    return this.analyticsService.removeFunnelDefinition(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_analytics')
  @Post('retention/prune')
  pruneRetention() {
    return this.analyticsService.pruneRetention();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get('export')
  async exportCsv(
    @Query() query: AnalyticsEventsQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="analytics-events.csv"',
    );
    return this.analyticsService.exportCsv(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_analytics')
  @Get()
  list(@Query() query: AnalyticsEventsQueryDto) {
    return this.analyticsService.list(query);
  }
}
