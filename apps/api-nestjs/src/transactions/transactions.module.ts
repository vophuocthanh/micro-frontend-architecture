import { Module } from '@nestjs/common';

import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsRepository } from './repositories/transactions.repository';
import { TransactionsService } from './services/transactions.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository],
  exports: [TransactionsRepository],
})
export class TransactionsModule {}
