import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactMessageDto } from './contact-message.dto';
import { ContactWebhookService } from './contact-webhook.service';

@Injectable()
export class ContactMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: ContactWebhookService,
  ) {}

  async create(dto: CreateContactMessageDto, ip?: string, userAgent?: string) {
    const message = await this.prisma.contactMessage.create({
      data: {
        name: this.clean(dto.name),
        email: dto.email.toLowerCase(),
        subject: dto.subject ? this.clean(dto.subject) : null,
        message: this.clean(dto.message),
        ipHash: ip ? this.hash(ip) : null,
        userAgent,
      },
    });
    void this.webhookService.dispatch(message);
    return message;
  }

  list(status?: string) {
    return this.prisma.contactMessage.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id },
    });
    if (!message || message.deletedAt) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'deleted' },
    });
  }

  private clean(value: string) {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
