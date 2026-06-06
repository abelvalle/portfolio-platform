import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Patch()
  updateProfile(@Body() body: UpdateProfileDto) {
    return this.resourcesService.updateProfile(body);
  }
}
