<script setup lang="ts">
import PanelCard from '../../components/PanelCard.vue';
import StateBlock from '../../components/StateBlock.vue';
import BankCard from '../cards/BankCard.vue';
import TransactionHistory from '../transactions/TransactionHistory.vue';
import { useAccount } from '../../composables/use-account-queries';
import { useShellRoute } from '../../router/use-shell-route';
import { formatDate, formatMoney, humanise } from '../../utils/format';

const props = defineProps<{ accountId: string }>();

const { data: account, isPending, isError, error, refetch } = useAccount(() => props.accountId);
const { goToList } = useShellRoute();
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
