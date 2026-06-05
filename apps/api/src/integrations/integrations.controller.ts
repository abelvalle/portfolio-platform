import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { LinkedinService } from './linkedin.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly linkedinService: LinkedinService) {}

  @Get('linkedin/status')
  linkedinStatus() {
    return this.linkedinService.status();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @Get('linkedin/auth-url')
  linkedinAuthUrl(@Query('state') state = 'portfolio-platform') {
    return this.linkedinService.authUrl(state);
  }

  @Get('linkedin/share-url')
  linkedinShareUrl(@Query('path') path = '/') {
    return this.linkedinService.shareUrl(path);
  }
}
