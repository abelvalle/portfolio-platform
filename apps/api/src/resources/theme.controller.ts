import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourcesService } from './resources.service';

@ApiTags('theme')
@Controller('theme')
export class ThemeController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  getTheme() {
    return this.resourcesService.getTheme();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Patch()
  updateTheme(@Body() body: Record<string, unknown>) {
    return this.resourcesService.updateTheme(body);
  }
}
