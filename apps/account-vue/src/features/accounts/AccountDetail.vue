<script setup lang="ts">
import type { Account } from '@banking/contracts';

import PanelCard from '../../components/PanelCard.vue';
import StateBlock from '../../components/StateBlock.vue';
import BankCard from '../cards/BankCard.vue';
import TransactionHistory from '../transactions/TransactionHistory.vue';
import { useAccount } from '../../composables/use-account-queries';
import { useShellRoute } from '../../router/use-shell-route';
import { useShell } from '../../shell/shell-context';
import { formatDate, formatMoney, humanise } from '../../utils/format';

const props = defineProps<{ accountId: string }>();

const { data: account, isPending, isError, error, refetch } = useAccount(() => props.accountId);
const { goToList } = useShellRoute();
const shell = useShell();

/**
 * Hands the user over to the Transfer application with this account already
 * chosen as the source.
 *
 * Two separate things, and the split is the whole point. The event says *what
 * the user is working on* and is addressed to the platform, not to Transfer —
 * anything else listening gets it too. `navigateToApp` says *where to go* by
 * naming an application rather than a URL, so this file never learns that
 * Transfer is mounted at `/banking/transfer`.
 *
 * Neither call mentions Angular, and nothing here imports a line of it.
 */
function transferFrom(account: Account): void {
  shell.events.emit('account:selected', {
    accountId: account.id,
    accountNumber: account.accountNumber,
    currency: account.currency,
  });
  shell.navigateToApp('transfer');
}
</script>

<template>
  <div class="detail">
    <button type="button" class="back" @click="goToList()">← All accounts</button>

    <StateBlock v-if="isPending" state="loading" label="Loading account" />

    <StateBlock
      v-else-if="isError"
      state="error"
      label="Could not load this account"
      :error="error"
      @retry="refetch()"
    />

    <!-- Narrowing on the data itself, not on `isPending`: the Vue template
         compiler cannot follow a discriminated union across sibling `v-if`
         branches, so this is what keeps the success branch type-safe. -->
    <template v-else-if="account">
      <div class="summary">
        <BankCard :account="account" />

        <PanelCard title="Account details">
          <dl class="facts">
            <div class="fact">
              <dt>Available balance</dt>
              <dd>{{ formatMoney(account.availableBalanceMinor, account.currency) }}</dd>
            </div>
            <div class="fact">
              <dt>Current balance</dt>
              <dd>{{ formatMoney(account.balanceMinor, account.currency) }}</dd>
            </div>
            <div class="fact">
              <dt>Type</dt>
              <dd>{{ humanise(account.type) }}</dd>
            </div>
            <div class="fact">
              <dt>Status</dt>
              <dd>{{ humanise(account.status) }}</dd>
            </div>
            <div class="fact">
              <dt>Opened</dt>
              <dd>{{ formatDate(account.openedAt) }}</dd>
            </div>
          </dl>
        </PanelCard>
      </div>

      <div class="handoff">
        <div class="handoff-copy">
          <p class="handoff-title">Send money from this account</p>
          <p class="handoff-hint">
            Opens the Transfer application with {{ account.nickname }} already selected.
          </p>
        </div>
        <button
          type="button"
          class="handoff-action"
          :disabled="account.status !== 'ACTIVE'"
          @click="transferFrom(account)"
        >
          Transfer from this account →
        </button>
      </div>

      <TransactionHistory :account-id="account.id" />
    </template>
  </div>
</template>

<style scoped>
.detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.back {
  align-self: flex-start;
  padding: 0.375rem 0.75rem 0.375rem 0.5rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1d4ed8;
  background: none;
  border: 0;
  border-radius: 0.5rem;
  cursor: pointer;
}

.back:hover {
  background: #eff6ff;
}

.back:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}

.summary {
  display: grid;
  grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

@media (max-width: 48rem) {
  .summary {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* The hand-off is deliberately prominent: it is the seam between two
   applications, and a user should never have to know that crossing it means
   loading a different framework from a different origin. */
.handoff {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.75rem;
}

.handoff-copy {
  min-width: 0;
}

.handoff-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e3a8a;
}

.handoff-hint {
  margin: 0.125rem 0 0;
  font-size: 0.8125rem;
  color: #475569;
}

.handoff-action {
  padding: 0.5rem 0.875rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: #1d4ed8;
  border: 0;
  border-radius: 0.5rem;
  cursor: pointer;
}

.handoff-action:hover:not(:disabled) {
  background: #1e40af;
}

.handoff-action:disabled {
  cursor: not-allowed;
  background: #94a3b8;
}

.handoff-action:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 0.875rem;
  margin: 0;
}

.fact dt {
  font-size: 0.75rem;
  color: #64748b;
}

.fact dd {
  margin: 0.125rem 0 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}
</style>
