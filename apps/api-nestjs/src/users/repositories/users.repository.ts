import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * All persistence for the user aggregate. Keeping Prisma behind a repository
 * means services describe *what* they need rather than how it is stored, and
 * the query shapes for one aggregate stay in one file where their indexes can
 * be reasoned about together.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
