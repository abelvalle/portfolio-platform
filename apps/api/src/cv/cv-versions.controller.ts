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
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import { CvVersionService } from './cv-version.service';

@ApiTags('cv-versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('read_cv')
@Controller('cv-versions')
export class CvVersionsController {
  constructor(private readonly cvVersionService: CvVersionService) {}

  @Get()
  list() {
    return this.cvVersionService.list();
  }

  @Get('audit-log')
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  auditTrail(
    @Query('action') action?: string,
    @Query('resourceId') resourceId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cvVersionService.auditTrail({
      action,
      resourceId,
      userId,
      from,
      to,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cvVersionService.findOne(id);
  }

  @RequirePermissions('manage_cv')
  @Post()
  create(
    @Body() body: Record<string, any>,
    @CurrentUser() user: { id?: string },
  ) {
    return this.cvVersionService.create(body, user?.id);
  }

  @RequirePermissions('manage_cv')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, any>,
    @CurrentUser() user: { id?: string },
  ) {
    return this.cvVersionService.update(id, body, user?.id);
  }

  @RequirePermissions('manage_cv')
  @Post(':id/generate-pdf')
  generatePdf(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.cvVersionService.generatePdf(id, user?.id);
  }

  @RequirePermissions('manage_cv')
  @Post(':id/generate-docx')
  generateDocx(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.cvVersionService.generateDocx(id, user?.id);
  }

  @RequirePermissions('manage_cv')
  @Post(':id/set-primary')
  setPrimary(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.cvVersionService.setPrimary(id, user?.id);
  }

  @RequirePermissions('manage_cv')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.cvVersionService.remove(id, user?.id);
  }
}
