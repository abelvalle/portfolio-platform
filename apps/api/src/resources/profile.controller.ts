import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import { UpdateProfileDto } from './profile.dto';
import { ResourcesService } from './resources.service';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  getProfile() {
    return this.resourcesService.getProfile();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_portfolio')
  @Patch()
  updateProfile(@Body() body: UpdateProfileDto) {
    return this.resourcesService.updateProfile(body);
  }
}
