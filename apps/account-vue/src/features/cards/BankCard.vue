<script setup lang="ts">
import type { Account } from '@banking/contracts';
import { computed } from 'vue';

import { formatMoney, humanise } from '../../utils/format';

const props = defineProps<{ account: Account }>();

const gradient = computed(() => {
  switch (props.account.type) {
    case 'SAVINGS':
      return 'linear-gradient(135deg, #047857, #0f766e)';
    case 'CREDIT':
      return 'linear-gradient(135deg, #7c3aed, #4338ca)';
    default:
      return 'linear-gradient(135deg, #1d4ed8, #0ea5e9)';
  }
});
</script>

<template>
  <article class="card" :style="{ backgroundImage: gradient }">
    <header class="top">
      <span class="type">{{ humanise(account.type) }}</span>
      <span v-if="account.status !== 'ACTIVE'" class="status">{{ account.status }}</span>
    </header>

    <p class="number">{{ account.accountNumber }}</p>

    <footer class="bottom">
      <span class="nickname">{{ account.nickname }}</span>
      <span class="balance">{{ formatMoney(account.balanceMinor, account.currency) }}</span>
    </footer>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 10rem;
  padding: 1.25rem;
  color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 10px 24px -12px rgb(15 23 42 / 45%);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.type {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.status {
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: rgb(255 255 255 / 22%);
  border-radius: 999px;
}

.number {
  margin: 0;
  font-size: 1.125rem;
  letter-spacing: 0.12em;
  font-variant-numeric: tabular-nums;
}

.bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
}

.nickname {
  font-size: 0.875rem;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.balance {
  font-size: 1.25rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
