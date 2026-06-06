import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cvVersionService.findOne(id);
  }

  @RequirePermissions('manage_cv')
  @Post()
  create(@Body() body: Record<string, any>) {
    return this.cvVersionService.create(body);
  }

  @RequirePermissions('manage_cv')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.cvVersionService.update(id, body);
  }

  @RequirePermissions('manage_cv')
  @Post(':id/generate-pdf')
  generatePdf(@Param('id') id: string) {
    return this.cvVersionService.generatePdf(id);
  }

  @RequirePermissions('manage_cv')
  @Post(':id/generate-docx')
  generateDocx(@Param('id') id: string) {
    return this.cvVersionService.generateDocx(id);
  }

  @RequirePermissions('manage_cv')
  @Post(':id/set-primary')
  setPrimary(@Param('id') id: string) {
    return this.cvVersionService.setPrimary(id);
  }

  @RequirePermissions('manage_cv')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cvVersionService.remove(id);
  }
}
