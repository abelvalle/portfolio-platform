import { Module } from '@nestjs/common';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';
import { ContactWebhookService } from './contact-webhook.service';

@Module({
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService, ContactWebhookService],
  exports: [ContactMessagesService],
})
export class ContactMessagesModule {}
