<script setup lang="ts">
import { storeToRefs } from 'pinia';

import PanelCard from '../../components/PanelCard.vue';
import StateBlock from '../../components/StateBlock.vue';
import BeneficiaryForm from './BeneficiaryForm.vue';
import { useBeneficiaries, useToggleFavourite } from '../../composables/use-account-queries';
import { useAccountUiStore } from '../../stores/account-ui.store';
import { useShell } from '../../shell/shell-context';

const { data: beneficiaries, isPending, isError, error, refetch } = useBeneficiaries();
const toggleFavourite = useToggleFavourite();

const uiStore = useAccountUiStore();
const { isAddingBeneficiary } = storeToRefs(uiStore);

const { auth } = useShell();
// Hiding the control is a courtesy; POST /beneficiaries checks the same
// permission and refuses regardless of what this component rendered.
const canManage = auth.hasPermission('MANAGE_BENEFICIARY');
</script>

<template>
  <PanelCard title="Payees" :hint="beneficiaries ? `${beneficiaries.length} saved` : undefined">
    <StateBlock v-if="isPending" state="loading" label="Loading payees" />

    <StateBlock
      v-else-if="isError"
      state="error"
      label="Could not load payees"
      :error="error"
      @retry="refetch()"
    />

    <template v-else-if="beneficiaries">
      <StateBlock
        v-if="beneficiaries.length === 0 && !isAddingBeneficiary"
        state="empty"
        label="No payees yet"
        description="Add someone you pay regularly to make transfers faster."
      />

      <ul v-else class="list">
        <li v-for="beneficiary in beneficiaries" :key="beneficiary.id" class="row">
          <span class="identity">
            <span class="name">{{ beneficiary.fullName }}</span>
            <span class="meta">{{ beneficiary.bankName }} · {{ beneficiary.accountNumber }}</span>
          </span>

          <button
            v-if="canManage"
            type="button"
            class="star"
            :aria-pressed="beneficiary.isFavourite"
            :aria-label="`${beneficiary.isFavourite ? 'Remove' : 'Mark'} ${beneficiary.fullName} as a favourite`"
            @click="toggleFavourite.mutate({ id: beneficiary.id, isFavourite: !beneficiary.isFavourite })"
          >
            {{ beneficiary.isFavourite ? '★' : '☆' }}
          </button>
        </li>
      </ul>

      <BeneficiaryForm
        v-if="isAddingBeneficiary"
        @done="uiStore.closeBeneficiaryForm()"
      />
      <button
        v-else-if="canManage"
        type="button"
        class="add"
        @click="uiStore.openBeneficiaryForm()"
      >
        + Add payee
      </button>
    </template>
  </PanelCard>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.row:last-child {
  border-bottom: 0;
}

.identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: 0.75rem;
  color: #64748b;
}

.star {
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  line-height: 1;
  color: #d97706;
  background: none;
  border: 0;
  border-radius: 0.375rem;
  cursor: pointer;
}

.star:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}

.add {
  align-self: flex-start;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  cursor: pointer;
}

.add:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}
</style>
