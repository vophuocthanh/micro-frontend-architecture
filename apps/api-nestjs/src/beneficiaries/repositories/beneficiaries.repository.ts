import { Injectable } from '@nestjs/common';
import type { Beneficiary, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BeneficiariesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string): Promise<Beneficiary[]> {
    return this.prisma.beneficiary.findMany({
      where: { userId },
      orderBy: [{ isFavourite: 'desc' }, { fullName: 'asc' }],
    });
  }

  findOneByUser(userId: string, id: string): Promise<Beneficiary | null> {
    return this.prisma.beneficiary.findFirst({ where: { id, userId } });
  }

  create(userId: string, data: Prisma.BeneficiaryCreateWithoutUserInput): Promise<Beneficiary> {
    return this.prisma.beneficiary.create({ data: { ...data, user: { connect: { id: userId } } } });
  }

  update(
    userId: string,
    id: string,
    data: Prisma.BeneficiaryUpdateInput,
  ): Promise<{ count: number }> {
    return this.prisma.beneficiary.updateMany({ where: { id, userId }, data });
  }

  delete(userId: string, id: string): Promise<{ count: number }> {
    return this.prisma.beneficiary.deleteMany({ where: { id, userId } });
  }
}
