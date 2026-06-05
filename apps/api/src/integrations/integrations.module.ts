import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { LinkedinService } from './linkedin.service';

@Module({
  controllers: [IntegrationsController],
  providers: [LinkedinService],
  exports: [LinkedinService],
})
export class IntegrationsModule {}
