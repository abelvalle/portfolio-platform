import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Type,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourcesService } from './resources.service';

export function createResourceController(
  path: string,
  model: string,
): Type<any> {
  @ApiTags(path)
  @Controller(path)
  class ResourceController {
    constructor(public readonly resourcesService: ResourcesService) {}

    @Get()
    list(@Query('includeHidden') includeHidden?: string) {
      return this.resourcesService.list(model, includeHidden === 'true');
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.resourcesService.findOne(model, id);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin, UserRole.editor)
    @Post()
    create(@Body() body: Record<string, unknown>) {
      return this.resourcesService.create(model, body);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin, UserRole.editor)
    @Patch(':id')
    update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
      return this.resourcesService.update(model, id, body);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.admin, UserRole.editor)
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.resourcesService.remove(model, id);
    }
  }

  return ResourceController;
}
