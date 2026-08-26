import { Injectable } from '@nestjs/common';

import type { Paginated, SpendingOverview, Transaction } from '@banking/contracts';

import { paginate, resolvePage } from '../../common/pagination/pagination';
import type { TransactionQueryDto } from '../dto/transaction-query.dto';
import { toTransactionContract } from '../mappers/transaction.mapper';
import { TransactionsRepository } from '../repositories/transactions.repository';
import { buildSpendingOverview } from './spending-overview.builder';

const DEFAULT_RECENT_LIMIT = 10;
const MAX_RECENT_LIMIT = 50;
const DEFAULT_OVERVIEW_MONTHS = 6;

@Injectable()
export class TransactionsService {
  constructor(private readonly transactions: TransactionsRepository) {}

  async list(userId: string, query: TransactionQueryDto): Promise<Paginated<Transaction>> {
    const page = resolvePage(query.page, query.pageSize);

    const { items, total } = await this.transactions.findPage(
      {
        userId,
        ...(query.accountId ? { accountId: query.accountId } : {}),
        ...(query.category ? { category: query.category } : {}),
        ...(query.from ? { from: new Date(query.from) } : {}),
        ...(query.to ? { to: new Date(query.to) } : {}),
      },
      page,
    );

    return paginate(items.map(toTransactionContract), total, page);
  }

  async recent(userId: string, limit?: number): Promise<Transaction[]> {
    const resolved = Math.min(MAX_RECENT_LIMIT, Math.max(1, limit ?? DEFAULT_RECENT_LIMIT));
    const items = await this.transactions.findRecent(userId, resolved);
    return items.map(toTransactionContract);
  }

  async spendingOverview(userId: string, months?: number): Promise<SpendingOverview> {
    const monthCount = months ?? DEFAULT_OVERVIEW_MONTHS;
    const periodEnd = new Date();
    const periodStart = new Date(
      Date.UTC(periodEnd.getUTCFullYear(), periodEnd.getUTCMonth() - (monthCount - 1), 1),
    );

    const [categoryTotals, monthlyTotals] = await Promise.all([
      this.transactions.sumByCategory(userId, periodStart, periodEnd),
      this.transactions.sumByMonth(userId, periodStart, periodEnd),
    ]);

    return buildSpendingOverview({ periodStart, periodEnd, categoryTotals, monthlyTotals });
  }
}
