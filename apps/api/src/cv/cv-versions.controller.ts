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
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CvVersionService } from './cv-version.service';

@ApiTags('cv-versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
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

  @Roles(UserRole.admin, UserRole.editor)
  @Post()
  create(@Body() body: Record<string, any>) {
    return this.cvVersionService.create(body);
  }

  @Roles(UserRole.admin, UserRole.editor)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.cvVersionService.update(id, body);
  }

  @Roles(UserRole.admin, UserRole.editor)
  @Post(':id/generate-pdf')
  generatePdf(@Param('id') id: string) {
    return this.cvVersionService.generatePdf(id);
  }

  @Roles(UserRole.admin, UserRole.editor)
  @Post(':id/generate-docx')
  generateDocx(@Param('id') id: string) {
    return this.cvVersionService.generateDocx(id);
  }

  @Roles(UserRole.admin, UserRole.editor)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cvVersionService.remove(id);
  }
}
