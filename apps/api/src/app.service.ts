import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      name: 'portfolio-platform-api',
      status: 'ok',
      version: '0.1.0',
    };
  }
}
