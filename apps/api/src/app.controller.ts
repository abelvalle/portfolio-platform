import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/live')
  getLiveness() {
    return this.appService.getLiveness();
  }

  @Get('health/ready')
  getReadiness() {
    return this.appService.getReadiness();
  }
}
