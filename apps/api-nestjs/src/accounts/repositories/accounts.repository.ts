import { Injectable } from '@nestjs/common';
import type { Account } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

/**
 * Every method takes `userId` and every query filters on it.
 *
 * Ownership is enforced in the `where` clause rather than by loading a row and
 * comparing afterwards: the query simply cannot return another customer's
 * account, so no call site can forget the check.
 */
@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId, status: { not: 'CLOSED' } },
      orderBy: [{ type: 'asc' }, { openedAt: 'asc' }],
    });
  }

  findOneByUser(userId: string, accountId: string): Promise<Account | null> {
    return this.prisma.account.findFirst({ where: { id: accountId, userId } });
  }

  updateNickname(userId: string, accountId: string, nickname: string): Promise<{ count: number }> {
    return this.prisma.account.updateMany({ where: { id: accountId, userId }, data: { nickname } });
  }
}
