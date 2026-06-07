import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
import {
  BulkContactMessageStatusDto,
  ContactMessageQueryDto,
  CreateContactMessageDto,
} from './contact-message.dto';
import { ContactMessagesService } from './contact-messages.service';
import { ContactWebhookService } from './contact-webhook.service';

@ApiTags('contact-messages')
@Controller('contact-messages')
export class ContactMessagesController {
  constructor(
    private readonly contactMessagesService: ContactMessagesService,
    private readonly contactWebhookService: ContactWebhookService,
  ) {}

  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post()
  create(@Body() body: CreateContactMessageDto, @Req() request: Request) {
    return this.contactMessagesService.create(
      body,
      request.ip,
      request.headers['user-agent'],
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_messages')
  @Get('webhook/status')
  webhookStatus() {
    return this.contactWebhookService.status();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_messages')
  @Get('webhook/deliveries')
  webhookDeliveries() {
    return this.contactWebhookService.deliveries();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_messages')
  @Post('webhook/messages/:id/retry')
  retryWebhook(@Param('id') id: string) {
    return this.contactWebhookService.retryMessage(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_messages')
  @Post('webhook/test')
  testWebhook() {
    return this.contactWebhookService.testDispatch();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_messages')
  @Get()
  list(@Query() query: ContactMessageQueryDto) {
    return this.contactMessagesService.list(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_messages')
  @Get('export')
  async exportCsv(
    @Query() query: ContactMessageQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="contact-messages.csv"',
    );
    return this.contactMessagesService.exportCsv(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('read_messages')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactMessagesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_messages')
  @Patch('status/bulk')
  bulkUpdateStatus(@Body() body: BulkContactMessageStatusDto) {
    return this.contactMessagesService.bulkUpdateStatus(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_messages')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.contactMessagesService.updateStatus(id, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('manage_messages')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactMessagesService.remove(id);
  }
}
