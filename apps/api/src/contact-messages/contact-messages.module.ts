import { Module } from '@nestjs/common';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';
import { ContactWebhookRetryWorker } from './contact-webhook-retry.worker';
import { ContactWebhookService } from './contact-webhook.service';

@Module({
  controllers: [ContactMessagesController],
  providers: [
    ContactMessagesService,
    ContactWebhookService,
    ContactWebhookRetryWorker,
  ],
  exports: [ContactMessagesService],
})
export class ContactMessagesModule {}
