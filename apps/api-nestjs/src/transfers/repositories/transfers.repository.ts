import { Injectable } from '@nestjs/common';
import { Prisma, type TransferStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type { PageParams } from '../../common/pagination/pagination';
import type { TransferWithBeneficiary } from '../mappers/transfer.mapper';

const WITH_BENEFICIARY = { beneficiary: { select: { fullName: true } } } as const;

@Injectable()
export class TransfersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findPage(
    userId: string,
    status: TransferStatus | undefined,
    page: PageParams,
  ): Promise<{ items: TransferWithBeneficiary[]; total: number }> {
    const where: Prisma.TransferWhereInput = { userId, ...(status ? { status } : {}) };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.transfer.findMany({
        where,
        include: WITH_BENEFICIARY,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.transfer.count({ where }),
    ]);

    return { items, total };
  }

  findOneByUser(userId: string, id: string): Promise<TransferWithBeneficiary | null> {
    return this.prisma.transfer.findFirst({ where: { id, userId }, include: WITH_BENEFICIARY });
  }

  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<TransferWithBeneficiary | null> {
    return this.prisma.transfer.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: WITH_BENEFICIARY,
    });
  }

  /**
   * What the customer has already moved today, used to enforce the daily limit.
   * Failed transfers are excluded — a transfer that never happened must not
   * consume allowance.
   */
  async sumTransferredToday(userId: string): Promise<Prisma.Decimal> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const result = await this.prisma.transfer.aggregate({
      where: { userId, status: { in: ['PENDING', 'COMPLETED'] }, createdAt: { gte: startOfDay } },
      _sum: { amount: true },
    });

    return result._sum.amount ?? new Prisma.Decimal(0);
  }
}
