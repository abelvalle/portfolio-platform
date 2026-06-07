import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth() {
    return {
      name: 'portfolio-platform-api',
      status: 'ok',
      version: '0.1.0',
    };
  }

  getLiveness() {
    return {
      ...this.getHealth(),
      check: 'liveness',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ...this.getHealth(),
        check: 'readiness',
        status: 'ready',
        checks: { database: 'ok' },
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        ...this.getHealth(),
        check: 'readiness',
        status: 'not_ready',
        checks: { database: 'error' },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
