import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_integrations')
  @Get('linkedin/auth-url')
  linkedinAuthUrl(@Query('state') state = 'portfolio-platform') {
    return this.linkedinService.authUrl(state);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_integrations')
  @Get('linkedin/callback')
  linkedinCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
  ) {
    return this.linkedinService.callback(code, state);
  }

  @Get('linkedin/share-url')
  linkedinShareUrl(@Query('path') path = '/') {
    return this.linkedinService.shareUrl(path);
  }
}
