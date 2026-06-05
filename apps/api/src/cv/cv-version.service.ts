import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CvVersionService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.cvVersion.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const version = await this.prisma.cvVersion.findUnique({ where: { id } });
    if (!version || version.deletedAt) {
      throw new NotFoundException('CV version not found');
    }
    return version;
  }

  create(data: Record<string, any>) {
    return this.prisma.cvVersion.create({
      data: {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: data.status || PublishStatus.draft,
        structuredJson: data.structuredJson || {},
      } as any,
    });
  }

  async update(id: string, data: Record<string, any>) {
    await this.findOne(id);
    return this.prisma.cvVersion.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.cvVersion.update({
      where: { id },
      data: { deletedAt: new Date(), status: PublishStatus.archived },
    });
  }
}
