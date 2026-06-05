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
import { AdaptCvDto, CompareVersionsDto, CreateCvDto } from './cv.dto';
import { CvAdaptationService } from './cv-adaptation.service';
import { CvService } from './cv.service';

@ApiTags('cv')
@Controller('cv')
export class CvController {
  constructor(
    private readonly cvService: CvService,
    private readonly adaptationService: CvAdaptationService,
  ) {}

  @Get()
  getPrimary() {
    return this.cvService.getPrimary();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cvService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post()
  create(@Body() body: CreateCvDto) {
    return this.cvService.create(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.cvService.update(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cvService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post('import')
  import(@Body('rawText') rawText: string) {
    return this.cvService.importFromText(rawText || '');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post(':id/generate-pdf')
  generatePdf(@Param('id') id: string) {
    return this.cvService.generatePdf(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post(':id/generate-docx')
  generateDocx(@Param('id') id: string) {
    return this.cvService.generateDocx(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Get(':id/ats-report')
  getAtsReport(@Param('id') id: string) {
    return this.cvService.getAtsReport(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post(':id/generate-ats-pdf')
  generateAtsPdf(@Param('id') id: string) {
    return this.cvService.generateAtsPdf(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post(':id/generate-ats-docx')
  generateAtsDocx(@Param('id') id: string) {
    return this.cvService.generateAtsDocx(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post(':id/set-primary')
  setPrimary(@Param('id') id: string) {
    return this.cvService.setPrimary(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post('adapt-to-role')
  adapt(@Body() body: AdaptCvDto) {
    return this.adaptationService.adapt(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post('compare-versions')
  compare(@Body() body: CompareVersionsDto) {
    return this.adaptationService.compare(body);
  }
}
