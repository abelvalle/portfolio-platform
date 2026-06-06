import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/guards/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminPublicationService } from './admin-publication.service';

@ApiTags('admin-publication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
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

  @Roles(UserRole.admin, UserRole.editor)
  @Post('theme/publish')
  publishTheme(@CurrentUser() user: { id?: string }) {
    return this.publicationService.publishThemeDraft(user?.id);
  }

  @Roles(UserRole.admin, UserRole.editor)
  @Post('profile/publish')
  publishProfile(@CurrentUser() user: { id?: string }) {
    return this.publicationService.publishProfileDraft(user?.id);
  }

  @Roles(UserRole.admin, UserRole.editor)
  @Post('changelog/:id/restore')
  restoreChange(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.publicationService.restorePublicationChange(id, user?.id);
  }
}
