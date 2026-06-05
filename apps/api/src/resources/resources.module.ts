import { Module } from '@nestjs/common';
import { createResourceController } from './resource-controller.factory';
import { ProfileController } from './profile.controller';
import { ResourcesService } from './resources.service';
import { ThemeController } from './theme.controller';

const ExperienceController = createResourceController(
  'experiences',
  'experience',
);
const EducationController = createResourceController('education', 'education');
const CertificationController = createResourceController(
  'certifications',
  'certification',
);
const SkillsController = createResourceController('skills', 'skill');
const SkillCategoriesController = createResourceController(
  'skill-categories',
  'skillCategory',
);
const ProjectsController = createResourceController('projects', 'project');
const ProjectCategoriesController = createResourceController(
  'project-categories',
  'projectCategory',
);
const PageSectionsController = createResourceController(
  'page-sections',
  'pageSection',
);
const AppModulesController = createResourceController(
  'app-modules',
  'appModule',
);

@Module({
  controllers: [
    ProfileController,
    ThemeController,
    ExperienceController,
    EducationController,
    CertificationController,
    SkillsController,
    SkillCategoriesController,
    ProjectsController,
    ProjectCategoriesController,
    PageSectionsController,
    AppModulesController,
  ],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
