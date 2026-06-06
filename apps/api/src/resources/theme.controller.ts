import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import { ResourcesService } from './resources.service';
import { UpdateThemeDto } from './theme.dto';

@ApiTags('theme')
@Controller('theme')
export class ThemeController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  getTheme() {
    return this.resourcesService.getTheme();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_portfolio')
  @Patch()
  updateTheme(@Body() body: UpdateThemeDto) {
    return this.resourcesService.updateTheme(body);
  }
}
