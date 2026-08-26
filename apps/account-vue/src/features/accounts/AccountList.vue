<script setup lang="ts">
import PanelCard from '../../components/PanelCard.vue';
import StateBlock from '../../components/StateBlock.vue';
import BankCard from '../cards/BankCard.vue';
import { useAccounts } from '../../composables/use-account-queries';
import { useShellRoute } from '../../router/use-shell-route';
import { useShell } from '../../shell/shell-context';

const { data: accounts, isPending, isError, error, refetch } = useAccounts();
const { goToDetail } = useShellRoute();
const { events } = useShell();

/**
 * Opening an account does two independent things: it changes this remote's
 * view, and it tells the rest of the platform which account the user is
 * working with. The Transfer application uses the second to pre-select a
 * source account — without either application knowing the other.
 */
function openAccount(accountId: string, accountNumber: string, currency: 'USD' | 'EUR' | 'VND'): void {
  events.emit('account:selected', { accountId, accountNumber, currency });
  goToDetail(accountId);
}
</script>

<template>
  <PanelCard title="Your accounts" :hint="accounts ? `${accounts.length} open` : undefined">
    <StateBlock v-if="isPending" state="loading" label="Loading your accounts" />

    <StateBlock
      v-else-if="isError"
      state="error"
      label="Could not load your accounts"
      :error="error"
      @retry="refetch()"
    />

    <StateBlock
      v-else-if="accounts && accounts.length === 0"
      state="empty"
      label="No open accounts"
      description="When an account is opened it will appear here."
    />

    <ul v-else-if="accounts" class="grid">
      <li v-for="account in accounts" :key="account.id">
        <button
          type="button"
          class="tile"
          @click="openAccount(account.id, account.accountNumber, account.currency)"
        >
          <BankCard :account="account" />
          <span class="sr-only">View {{ account.nickname }}</span>
        </button>
      </li>
    </ul>
  </PanelCard>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tile {
  display: block;
  width: 100%;
  padding: 0;
  background: none;
  border: 0;
  border-radius: 1rem;
  cursor: pointer;
  transition: transform 150ms ease;
}

.tile:hover {
  transform: translateY(-2px);
}

.tile:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .tile {
    transition: none;
  }

  .tile:hover {
    transform: none;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
