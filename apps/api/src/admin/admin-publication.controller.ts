import { Controller, Get, Post, UseGuards } from '@nestjs/common';
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

  @Get('changelog')
  changeLog() {
    return this.publicationService.latestChanges();
  }

  @Roles(UserRole.admin, UserRole.editor)
  @Post('theme/publish')
  publishTheme(@CurrentUser() user: { id?: string }) {
    return this.publicationService.publishThemeDraft(user?.id);
  }
}
