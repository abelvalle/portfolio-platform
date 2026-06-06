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
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
  @Get('webhook/status')
  webhookStatus() {
    return this.contactWebhookService.status();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Post('webhook/test')
  testWebhook() {
    return this.contactWebhookService.testDispatch();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
  @Get()
  list(@Query() query: ContactMessageQueryDto) {
    return this.contactMessagesService.list(query);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor, UserRole.viewer)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contactMessagesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.contactMessagesService.updateStatus(id, status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.editor)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactMessagesService.remove(id);
  }
}
