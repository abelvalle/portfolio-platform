import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';

const permissionMatrix: Record<UserRole, string[]> = {
  admin: [
    'manage_users',
    'manage_settings',
    'manage_portfolio',
    'manage_cv',
    'read_messages',
    'read_analytics',
  ],
  editor: ['manage_portfolio', 'manage_cv', 'read_messages', 'read_analytics'],
  viewer: ['read_dashboard', 'read_portfolio', 'read_cv', 'read_analytics'],
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
    });
    return users.map((user) => this.toPublicUser(user));
  }

  permissions() {
    return permissionMatrix;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('User already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, 12),
      },
    });
    return this.toPublicUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actorUserId: string) {
    await this.findActiveUser(id);
    if (id === actorUserId && dto.role && dto.role !== UserRole.admin) {
      throw new BadRequestException('An admin cannot demote their own account');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        ...(dto.password
          ? { passwordHash: await bcrypt.hash(dto.password, 12) }
          : {}),
      },
    });
    return this.toPublicUser(user);
  }

  async remove(id: string, actorUserId: string) {
    await this.findActiveUser(id);
    if (id === actorUserId) {
      throw new BadRequestException('An admin cannot delete their own account');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        refreshTokenHash: null,
      },
    });
    return this.toPublicUser(user);
  }

  private async findActiveUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
