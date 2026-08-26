import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';

import type { AuthenticatedUser, Paginated, SpendingOverview, Transaction } from '@banking/contracts';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { SpendingQueryDto } from '../dto/spending-query.dto';
import { TransactionQueryDto } from '../dto/transaction-query.dto';
import { TransactionsService } from '../services/transactions.service';

@Controller('transactions')
@RequirePermissions('VIEW_TRANSACTION')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TransactionQueryDto,
  ): Promise<Paginated<Transaction>> {
    return this.transactions.list(user.id, query);
  }

  @Get('recent')
  recent(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<Transaction[]> {
    return this.transactions.recent(user.id, limit);
  }

  @Get('spending-overview')
  spendingOverview(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SpendingQueryDto,
  ): Promise<SpendingOverview> {
    return this.transactions.spendingOverview(user.id, query.months);
  }
}
