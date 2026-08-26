<script setup lang="ts">
import AccountDetail from './features/accounts/AccountDetail.vue';
import AccountList from './features/accounts/AccountList.vue';
import BeneficiaryList from './features/beneficiaries/BeneficiaryList.vue';
import { usePlatformEvents } from './events/use-platform-events';
import { useShellRoute } from './router/use-shell-route';
import { useShell } from './shell/shell-context';

const { view } = useShellRoute();
const { auth } = useShell();
usePlatformEvents();

const canView = auth.hasPermission('VIEW_ACCOUNT');
</script>

<template>
  <div v-if="!canView" class="denied" role="status">
    <p class="denied-title">Accounts unavailable</p>
    <p>Your role does not include access to account information.</p>
  </div>

  <div v-else class="layout">
    <AccountDetail v-if="view.name === 'detail'" :account-id="view.accountId" />

    <template v-else>
      <AccountList />
      <BeneficiaryList />
    </template>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.denied {
  padding: 2rem;
  text-align: center;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
}

.denied-title {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}
</style>
