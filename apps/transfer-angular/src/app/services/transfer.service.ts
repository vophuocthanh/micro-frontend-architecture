import type {
  Account,
  Beneficiary,
  CreateTransferRequest,
  Paginated,
  Transfer,
  TransferQuote,
  TransferQuoteRequest,
} from '@banking/contracts';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import { SHELL_CONTEXT } from '../core/shell-context.token';

/**
 * Every call the Transfer domain makes. The base URL comes from the shell, so
 * the same build runs against a local API in development and a public one in
 * production without a rebuild.
 */
@Injectable({ providedIn: 'root' })
export class TransferService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(SHELL_CONTEXT).apiBaseUrl;

  listAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(this.url('/accounts'));
  }

  listBeneficiaries(): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(this.url('/beneficiaries'));
  }

  quote(request: TransferQuoteRequest): Observable<TransferQuote> {
    return this.http.post<TransferQuote>(this.url('/transfers/quote'), request);
  }

  create(request: CreateTransferRequest): Observable<Transfer> {
    return this.http.post<Transfer>(this.url('/transfers'), request);
  }

  history(page: number): Observable<Paginated<Transfer>> {
    return this.http.get<Paginated<Transfer>>(this.url('/transfers'), {
      params: { page, pageSize: 10 },
    });
  }

  private url(path: string): string {
    return new URL(path, this.baseUrl).toString();
  }
}
