import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AnalyticsDateRangeQueryDto } from '../analytics/analytics.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard(@Query() query: AnalyticsDateRangeQueryDto) {
    return this.adminService.dashboard(query);
  }
}
