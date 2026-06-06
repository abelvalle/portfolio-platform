import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import { AdminPublicationService } from './admin-publication.service';

@ApiTags('admin-publication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('read_publication')
@Controller('admin/publication')
export class AdminPublicationController {
  constructor(private readonly publicationService: AdminPublicationService) {}

  @Get('theme/review')
  themeReview() {
    return this.publicationService.themeReview();
  }

  @Get('profile/review')
  profileReview() {
    return this.publicationService.profileReview();
  }

  @Get('changelog')
  changeLog() {
    return this.publicationService.latestChanges();
  }

  @RequirePermissions('manage_publication')
  @Post('theme/publish')
  publishTheme(@CurrentUser() user: { id?: string }) {
    return this.publicationService.publishThemeDraft(user?.id);
  }

  @RequirePermissions('manage_publication')
  @Post('profile/publish')
  publishProfile(@CurrentUser() user: { id?: string }) {
    return this.publicationService.publishProfileDraft(user?.id);
  }

  @RequirePermissions('manage_publication')
  @Post('changelog/:id/restore')
  restoreChange(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.publicationService.restorePublicationChange(id, user?.id);
  }
}
