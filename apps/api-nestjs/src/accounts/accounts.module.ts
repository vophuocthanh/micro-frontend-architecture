import { Module } from '@nestjs/common';

import { AccountsController } from './controllers/accounts.controller';
import { AccountsRepository } from './repositories/accounts.repository';
import { AccountsService } from './services/accounts.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsRepository],
})
export class AccountsModule {}
