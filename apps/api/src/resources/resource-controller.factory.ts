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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/guards/permissions.decorator';
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
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('manage_portfolio')
    @Post()
    create(@Body() body: Record<string, unknown>) {
      return this.resourcesService.create(model, body);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('manage_portfolio')
    @Patch(':id')
    update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
      return this.resourcesService.update(model, id, body);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions('manage_portfolio')
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.resourcesService.remove(model, id);
    }
  }

  return ResourceController;
}
