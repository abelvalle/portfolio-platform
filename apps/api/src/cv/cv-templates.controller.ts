import { Module } from '@nestjs/common';
import { createResourceController } from '../resources/resource-controller.factory';
import { ResourcesService } from '../resources/resources.service';

export const CvTemplatesController = createResourceController(
  'cv-templates',
  'cvTemplate',
  'manage_cv',
);
export const CvTargetRolesController = createResourceController(
  'cv-target-roles',
  'cvTargetRole',
  'manage_cv',
);

@Module({
  controllers: [CvTemplatesController, CvTargetRolesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class CvTemplatesModule {}
