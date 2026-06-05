import { Module } from '@nestjs/common';
import { createResourceController } from '../resources/resource-controller.factory';
import { ResourcesService } from '../resources/resources.service';

const MediaController = createResourceController('media', 'mediaAsset');

@Module({
  controllers: [MediaController],
  providers: [ResourcesService],
})
export class MediaModule {}
