import { Module } from '@nestjs/common';
import { AdminPublicationController } from './admin-publication.controller';
import { AdminPublicationService } from './admin-publication.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, AdminPublicationController],
  providers: [AdminService, AdminPublicationService],
})
export class AdminModule {}
