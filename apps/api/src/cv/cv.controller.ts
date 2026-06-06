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
  adapt(@Body() body: AdaptCvDto) {
    return this.adaptationService.adapt(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_cv')
  @Post('compare-versions')
  compare(@Body() body: CompareVersionsDto) {
    return this.adaptationService.compare(body);
  }
}
