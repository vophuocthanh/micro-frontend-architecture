import { Injectable } from '@nestjs/common';

import type { Account, AccountSummary } from '@banking/contracts';

import { ResourceNotFoundException } from '../../common/errors/domain.exception';
import { toAccountContract, toAccountSummary } from '../mappers/account.mapper';
import { AccountsRepository } from '../repositories/accounts.repository';

@Injectable()
export class AccountsService {
  constructor(private readonly accounts: AccountsRepository) {}

  async list(userId: string): Promise<Account[]> {
    const accounts = await this.accounts.findManyByUser(userId);
    return accounts.map(toAccountContract);
  }

  async summary(userId: string): Promise<AccountSummary> {
    const accounts = await this.accounts.findManyByUser(userId);
    return toAccountSummary(accounts);
  }

  async getById(userId: string, accountId: string): Promise<Account> {
    const account = await this.accounts.findOneByUser(userId, accountId);
    if (!account) {
      // Deliberately 404 rather than 403 for an account owned by someone else:
      // a 403 would confirm the id exists.
      throw new ResourceNotFoundException('Account');
    }
    return toAccountContract(account);
  }

  async rename(userId: string, accountId: string, nickname: string): Promise<Account> {
    const { count } = await this.accounts.updateNickname(userId, accountId, nickname);
    if (count === 0) {
      throw new ResourceNotFoundException('Account');
    }
    return this.getById(userId, accountId);
  }
}
