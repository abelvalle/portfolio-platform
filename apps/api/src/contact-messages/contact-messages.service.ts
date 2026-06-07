import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import {
  ContactMessageQueryDto,
  CreateContactMessageDto,
} from './contact-message.dto';
import { ContactWebhookService } from './contact-webhook.service';

@Injectable()
export class ContactMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: ContactWebhookService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateContactMessageDto, ip?: string, userAgent?: string) {
    const message = await this.prisma.contactMessage.create({
      data: {
        name: this.clean(dto.name),
        email: dto.email.toLowerCase(),
        subject: dto.subject ? this.clean(dto.subject) : null,
        message: this.clean(dto.message),
        ipHash: ip ? this.hash(ip) : null,
        userAgent: this.storeUserAgent() ? userAgent : null,
      },
    });
    void this.webhookService.dispatch(message);
    return message;
  }

  list(query: ContactMessageQueryDto = {}) {
    return this.prisma.contactMessage.findMany({
      where: {
        ...this.dateRangeWhere(query),
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportCsv(query: ContactMessageQueryDto = {}) {
    const messages = await this.list(query);
    const rows = [
      ['name', 'email', 'subject', 'status', 'createdAt', 'message'],
      ...messages.map((message) => [
        message.name,
        message.email,
        message.subject || '',
        message.status,
        message.createdAt.toISOString(),
        message.message,
      ]),
    ];
    return rows.map((row) => row.map(csvCell).join(',')).join('\n');
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
    const salt = this.configService.get<string>('CONTACT_IP_HASH_SALT');
    return createHash('sha256')
      .update(salt ? `${salt}:${value}` : value)
      .digest('hex');
  }

  private storeUserAgent() {
    return (
      this.configService.get<string>('CONTACT_STORE_USER_AGENT') !== 'false'
    );
  }

  private dateRangeWhere(query: ContactMessageQueryDto): {
    createdAt?: Prisma.DateTimeFilter;
  } {
    const from = query.from ? startOfDayUtc(query.from) : null;
    const to = query.to ? endOfDayUtc(query.to) : null;

    if (from && to && from.getTime() > to.getTime()) {
      throw new BadRequestException('Invalid contact message date range');
    }

    const createdAt: Prisma.DateTimeFilter = {};
    if (from) {
      createdAt.gte = from;
    }
    if (to) {
      createdAt.lte = to;
    }

    return Object.keys(createdAt).length ? { createdAt } : {};
  }
}

function startOfDayUtc(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDayUtc(value: string) {
  return new Date(`${value}T23:59:59.999Z`);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
