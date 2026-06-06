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

  @Get('experiences/:id/review')
  experienceReview(@Param('id') id: string) {
    return this.publicationService.experienceReview(id);
  }

  @Get('projects/:id/review')
  projectReview(@Param('id') id: string) {
    return this.publicationService.projectReview(id);
  }

  @Get('skills/:id/review')
  skillReview(@Param('id') id: string) {
    return this.publicationService.skillReview(id);
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
  @Post('experiences/:id/publish')
  publishExperience(
    @Param('id') id: string,
    @CurrentUser() user: { id?: string },
  ) {
    return this.publicationService.publishExperienceDraft(id, user?.id);
  }

  @RequirePermissions('manage_publication')
  @Post('projects/:id/publish')
  publishProject(
    @Param('id') id: string,
    @CurrentUser() user: { id?: string },
  ) {
    return this.publicationService.publishProjectDraft(id, user?.id);
  }

  @RequirePermissions('manage_publication')
  @Post('skills/:id/publish')
  publishSkill(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.publicationService.publishSkillDraft(id, user?.id);
  }

  @RequirePermissions('manage_publication')
  @Post('changelog/:id/restore')
  restoreChange(@Param('id') id: string, @CurrentUser() user: { id?: string }) {
    return this.publicationService.restorePublicationChange(id, user?.id);
  }
}
