import { Injectable } from '@nestjs/common';
import { Prisma, type Transaction, type TransactionCategory, type TransactionDirection } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type { PageParams } from '../../common/pagination/pagination';

export interface TransactionFilter {
  userId: string;
  accountId?: string;
  category?: TransactionCategory;
  from?: Date;
  to?: Date;
}

export interface CategoryTotal {
  category: TransactionCategory;
  direction: TransactionDirection;
  total: Prisma.Decimal;
}

export interface MonthlyTotalRow {
  month: string;
  direction: TransactionDirection;
  total: Prisma.Decimal;
}

@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ownership travels through the relation filter (`account.userId`), so a
   * caller cannot widen the result set by passing someone else's `accountId` —
   * the extra condition only ever narrows it.
   */
  private buildWhere(filter: TransactionFilter): Prisma.TransactionWhereInput {
    return {
      account: { userId: filter.userId },
      ...(filter.accountId ? { accountId: filter.accountId } : {}),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.from || filter.to
        ? {
            bookedAt: {
              ...(filter.from ? { gte: filter.from } : {}),
              ...(filter.to ? { lte: filter.to } : {}),
            },
          }
        : {}),
    };
  }

  async findPage(
    filter: TransactionFilter,
    page: PageParams,
  ): Promise<{ items: Transaction[]; total: number }> {
    const where = this.buildWhere(filter);

    // One round trip for the page and its count; issuing them sequentially
    // would double the latency of every list screen for no benefit.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { bookedAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, total };
  }

  findRecent(userId: string, limit: number): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { account: { userId } },
      orderBy: { bookedAt: 'desc' },
      take: limit,
    });
  }

  async sumByCategory(userId: string, from: Date, to: Date): Promise<CategoryTotal[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['category', 'direction'],
      where: { account: { userId }, bookedAt: { gte: from, lte: to } },
      _sum: { amount: true },
    });

    return grouped.map((row) => ({
      category: row.category,
      direction: row.direction,
      total: row._sum.amount ?? new Prisma.Decimal(0),
    }));
  }

  /**
   * Monthly buckets are computed by Postgres rather than in Node: grouping
   * in memory would mean transferring every transaction in the period just to
   * produce twelve numbers.
   */
  sumByMonth(userId: string, from: Date, to: Date): Promise<MonthlyTotalRow[]> {
    return this.prisma.$queryRaw<MonthlyTotalRow[]>`
      SELECT to_char(date_trunc('month', t."bookedAt"), 'YYYY-MM') AS month,
             t."direction"                                          AS direction,
             SUM(t."amount")                                        AS total
      FROM "transactions" t
      JOIN "accounts" a ON a."id" = t."accountId"
      WHERE a."userId" = ${userId}
        AND t."bookedAt" >= ${from}
        AND t."bookedAt" <= ${to}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;
  }
}
