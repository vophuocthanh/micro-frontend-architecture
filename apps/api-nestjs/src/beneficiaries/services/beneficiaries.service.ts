import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { Beneficiary } from '@banking/contracts';

import { ConflictException, ResourceNotFoundException } from '../../common/errors/domain.exception';
import type { CreateBeneficiaryDto, UpdateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { toBeneficiaryContract } from '../mappers/beneficiary.mapper';
import { BeneficiariesRepository } from '../repositories/beneficiaries.repository';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class BeneficiariesService {
  constructor(private readonly beneficiaries: BeneficiariesRepository) {}

  async list(userId: string): Promise<Beneficiary[]> {
    const items = await this.beneficiaries.findManyByUser(userId);
    return items.map(toBeneficiaryContract);
  }

  async getById(userId: string, id: string): Promise<Beneficiary> {
    const beneficiary = await this.beneficiaries.findOneByUser(userId, id);
    if (!beneficiary) {
      throw new ResourceNotFoundException('Beneficiary');
    }
    return toBeneficiaryContract(beneficiary);
  }

  async create(userId: string, input: CreateBeneficiaryDto): Promise<Beneficiary> {
    try {
      const created = await this.beneficiaries.create(userId, input);
      return toBeneficiaryContract(created);
    } catch (error) {
      // Let the database's unique index decide, rather than checking first:
      // a read-then-write would still let two concurrent submits both pass.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException('A beneficiary with this account number already exists');
      }
      throw error;
    }
  }

  async update(userId: string, id: string, input: UpdateBeneficiaryDto): Promise<Beneficiary> {
    const { count } = await this.beneficiaries.update(userId, id, input);
    if (count === 0) {
      throw new ResourceNotFoundException('Beneficiary');
    }
    return this.getById(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const { count } = await this.beneficiaries.delete(userId, id);
    if (count === 0) {
      throw new ResourceNotFoundException('Beneficiary');
    }
  }
}
