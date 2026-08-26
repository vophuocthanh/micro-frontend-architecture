import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';

import type { Paginated, Transfer, TransferQuote } from '@banking/contracts';

import {
  AccountInactiveException,
  ConflictException,
  InsufficientFundsException,
  ResourceNotFoundException,
} from '../../common/errors/domain.exception';
import { toDecimal, toMinorUnits } from '../../common/money/money';
import { paginate, resolvePage } from '../../common/pagination/pagination';
import { PrismaService } from '../../database/prisma.service';
import type { CreateTransferDto, TransferQueryDto, TransferQuoteDto } from '../dto/create-transfer.dto';
import { toTransferContract, type TransferWithBeneficiary } from '../mappers/transfer.mapper';
import { TransfersRepository } from '../repositories/transfers.repository';
import { calculateFeeMinor, remainingDailyAllowanceMinor, TRANSFER_POLICY } from './transfer.policy';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    private readonly transfers: TransfersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(userId: string, query: TransferQueryDto): Promise<Paginated<Transfer>> {
    const page = resolvePage(query.page, query.pageSize);
    const { items, total } = await this.transfers.findPage(userId, query.status, page);
    return paginate(items.map(toTransferContract), total, page);
  }

  async getById(userId: string, id: string): Promise<Transfer> {
    const transfer = await this.transfers.findOneByUser(userId, id);
    if (!transfer) {
      throw new ResourceNotFoundException('Transfer');
    }
    return toTransferContract(transfer);
  }

  /**
   * A read-only preview of the same rules `create` enforces, so the review step
   * of the transfer wizard can show the real fee and the real remaining limit
   * instead of guessing at them client-side.
   */
  async quote(userId: string, input: TransferQuoteDto): Promise<TransferQuote> {
    const { account, beneficiary } = await this.loadParticipants(
      this.prisma,
      userId,
      input.sourceAccountId,
      input.beneficiaryId,
    );

    const feeMinor = calculateFeeMinor(input.amountMinor);
    const totalMinor = input.amountMinor + feeMinor;
    const transferredTodayMinor = toMinorUnits(await this.transfers.sumTransferredToday(userId));

    return {
      amountMinor: input.amountMinor,
      feeMinor,
      totalMinor,
      currency: beneficiary.currency,
      sourceAvailableAfterMinor: toMinorUnits(account.availableBalance) - totalMinor,
      dailyRemainingMinor: remainingDailyAllowanceMinor(transferredTodayMinor),
    };
  }

  async create(userId: string, input: CreateTransferDto): Promise<Transfer> {
    const replay = await this.transfers.findByIdempotencyKey(userId, input.idempotencyKey);
    if (replay) {
      this.logger.log(`Idempotent replay of transfer ${replay.reference}`);
      return toTransferContract(replay);
    }

    try {
      const transfer = await this.execute(userId, input);
      return toTransferContract(transfer);
    } catch (error) {
      // Two submits raced past the lookup above; the unique index caught the
      // second one, so return what the first one produced.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        const existing = await this.transfers.findByIdempotencyKey(userId, input.idempotencyKey);
        if (existing) {
          return toTransferContract(existing);
        }
        throw new ConflictException('A transfer with this idempotency key is already in flight');
      }
      throw error;
    }
  }

  /**
   * Debiting the account and recording the transfer must both happen or neither
   * must: a crash between them would either lose the customer's money or give
   * it away for free. An interactive transaction is what makes the balance
   * check and the debit a single atomic decision.
   */
  private async execute(userId: string, input: CreateTransferDto): Promise<TransferWithBeneficiary> {
    const feeMinor = calculateFeeMinor(input.amountMinor);
    const totalMinor = input.amountMinor + feeMinor;

    return this.prisma.$transaction(async (tx) => {
      const { account, beneficiary } = await this.loadParticipants(
        tx,
        userId,
        input.sourceAccountId,
        input.beneficiaryId,
      );

      if (account.status !== 'ACTIVE') {
        throw new AccountInactiveException(`Account is ${account.status.toLowerCase()}`);
      }

      if (account.currency !== beneficiary.currency) {
        throw new ConflictException('Cross-currency transfers are not supported');
      }

      const transferredTodayMinor = toMinorUnits(await this.sumTransferredToday(tx, userId));
      if (input.amountMinor > remainingDailyAllowanceMinor(transferredTodayMinor)) {
        throw new ConflictException(
          `Daily transfer limit of ${TRANSFER_POLICY.dailyLimitMinor / 100} ${account.currency} exceeded`,
        );
      }

      if (toMinorUnits(account.availableBalance) < totalMinor) {
        throw new InsufficientFundsException();
      }

      const transfer = await tx.transfer.create({
        data: {
          reference: generateReference(),
          userId,
          sourceAccountId: account.id,
          beneficiaryId: beneficiary.id,
          amount: toDecimal(input.amountMinor),
          fee: toDecimal(feeMinor),
          currency: account.currency,
          note: input.note ?? null,
          status: 'COMPLETED',
          idempotencyKey: input.idempotencyKey,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: { decrement: toDecimal(totalMinor) },
          availableBalance: { decrement: toDecimal(totalMinor) },
        },
      });

      // The transfer is the intent; the transaction is the ledger entry that
      // makes it visible in the account's history.
      await tx.transaction.create({
        data: {
          accountId: account.id,
          direction: 'DEBIT',
          amount: toDecimal(totalMinor),
          currency: account.currency,
          category: 'TRANSFER',
          description: input.note ?? `Transfer to ${beneficiary.fullName}`,
          counterparty: beneficiary.fullName,
          transferId: transfer.id,
        },
      });

      return { ...transfer, beneficiary: { fullName: beneficiary.fullName } };
    });
  }

  /**
   * Loads both sides of the transfer scoped to the caller. Passing the client
   * in lets the same ownership rules run inside a transaction and outside it,
   * so a quote can never accept a pair that a create would reject.
   */
  private async loadParticipants(
    client: Prisma.TransactionClient | PrismaService,
    userId: string,
    sourceAccountId: string,
    beneficiaryId: string,
  ) {
    const [account, beneficiary] = await Promise.all([
      client.account.findFirst({ where: { id: sourceAccountId, userId } }),
      client.beneficiary.findFirst({ where: { id: beneficiaryId, userId } }),
    ]);

    if (!account) throw new ResourceNotFoundException('Source account');
    if (!beneficiary) throw new ResourceNotFoundException('Beneficiary');

    return { account, beneficiary };
  }

  private async sumTransferredToday(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<Prisma.Decimal> {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const result = await tx.transfer.aggregate({
      where: { userId, status: { in: ['PENDING', 'COMPLETED'] }, createdAt: { gte: startOfDay } },
      _sum: { amount: true },
    });

    return result._sum.amount ?? new Prisma.Decimal(0);
  }
}

function generateReference(): string {
  return `TRF-${randomBytes(4).toString('hex').toUpperCase()}`;
}
