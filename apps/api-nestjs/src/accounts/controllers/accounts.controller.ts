import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

import type { Account, AccountSummary, AuthenticatedUser } from '@banking/contracts';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { AccountsService } from '../services/accounts.service';

@Controller('accounts')
@RequirePermissions('VIEW_ACCOUNT')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<Account[]> {
    return this.accounts.list(user.id);
  }

  /** Declared before `:id` so that `summary` is never parsed as an account id. */
  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser): Promise<AccountSummary> {
    return this.accounts.summary(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Account> {
    return this.accounts.getById(user.id, id);
  }

  @Patch(':id')
  rename(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: UpdateAccountDto,
  ): Promise<Account> {
    return this.accounts.rename(user.id, id, body.nickname);
  }
}
