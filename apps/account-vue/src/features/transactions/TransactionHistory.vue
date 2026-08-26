<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';

import PanelCard from '../../components/PanelCard.vue';
import StateBlock from '../../components/StateBlock.vue';
import { useAccountTransactions } from '../../composables/use-account-queries';
import { useAccountUiStore } from '../../stores/account-ui.store';
import { formatDate, formatMoney, humanise } from '../../utils/format';

const props = defineProps<{ accountId: string }>();

const uiStore = useAccountUiStore();
const { transactionPage } = storeToRefs(uiStore);

// Paging is per-account: without this, opening a second account would land the
// user on page 4 of a list that has two pages.
watch(() => props.accountId, () => uiStore.resetTransactionPage(), { immediate: true });

const { data, isPending, isError, error, refetch, isPlaceholderData } = useAccountTransactions(
  () => props.accountId,
  transactionPage,
);

const canGoBack = computed(() => transactionPage.value > 1);
const canGoForward = computed(() => (data.value ? transactionPage.value < data.value.totalPages : false));
</script>

<template>
  <PanelCard title="Transaction history" :hint="data ? `${data.total} total` : undefined">
    <StateBlock v-if="isPending" state="loading" label="Loading transactions" />

    <StateBlock
      v-else-if="isError"
      state="error"
      label="Could not load transactions"
      :error="error"
      @retry="refetch()"
    />

    <StateBlock
      v-else-if="data && data.items.length === 0"
      state="empty"
      label="No transactions yet"
      description="Payments and deposits on this account will appear here."
    />

    <template v-else-if="data">
      <table class="table" :aria-busy="isPlaceholderData">
        <caption class="sr-only">Transactions, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col" class="numeric">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in data.items" :key="transaction.id">
            <td class="date">{{ formatDate(transaction.bookedAt) }}</td>
            <td>
              <span class="counterparty">{{ transaction.counterparty }}</span>
              <span class="category">{{ humanise(transaction.category) }}</span>
            </td>
            <td class="numeric" :class="transaction.direction === 'CREDIT' ? 'credit' : 'debit'">
              {{ transaction.direction === 'CREDIT' ? '+' : '−'
              }}{{ formatMoney(transaction.amountMinor, transaction.currency) }}
            </td>
          </tr>
        </tbody>
      </table>

      <nav class="pager" aria-label="Transaction pages">
        <button
          type="button"
          :disabled="!canGoBack"
          @click="uiStore.setTransactionPage(transactionPage - 1)"
        >
          Previous
        </button>
        <span aria-live="polite">Page {{ data.page }} of {{ data.totalPages }}</span>
        <button
          type="button"
          :disabled="!canGoForward"
          @click="uiStore.setTransactionPage(transactionPage + 1)"
        >
          Next
        </button>
      </nav>
    </template>
  </PanelCard>
</template>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.table th {
  padding: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e2e8f0;
}

.table td {
  padding: 0.625rem 0;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.table tr:last-child td {
  border-bottom: 0;
}

.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.date {
  color: #64748b;
  white-space: nowrap;
}

.counterparty {
  display: block;
  font-weight: 600;
  color: #0f172a;
}

.category {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.credit {
  color: #047857;
  font-weight: 600;
}

.debit {
  color: #0f172a;
  font-weight: 600;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  font-size: 0.8125rem;
  color: #64748b;
}

.pager button {
  padding: 0.375rem 0.75rem;
  font: inherit;
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  cursor: pointer;
}

.pager button:disabled {
  color: #94a3b8;
  background: #f8fafc;
  border-color: #e2e8f0;
  cursor: not-allowed;
}

.pager button:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
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
