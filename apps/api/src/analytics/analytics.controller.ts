import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import {
  AnalyticsDateRangeQueryDto,
  AnalyticsEventsQueryDto,
  CreateAnalyticsEventDto,
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
  @Get('summary')
  summary(@Query() query: AnalyticsDateRangeQueryDto) {
    return this.analyticsService.summary(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
  @Get()
  list(@Query() query: AnalyticsEventsQueryDto) {
    return this.analyticsService.list(query);
  }
}
