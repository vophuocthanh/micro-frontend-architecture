import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Client-only UI state for the Account domain.
 *
 * Note what is *not* here: accounts, balances, beneficiaries. Those are server
 * state and live in the query cache, which knows how to refetch and invalidate
 * them. Copying them into a store would create a second source of truth that
 * goes stale silently — the mistake this split exists to prevent.
 */
export const useAccountUiStore = defineStore('account-ui', () => {
  const transactionPage = ref(1);
  const isAddingBeneficiary = ref(false);

  function setTransactionPage(page: number): void {
    transactionPage.value = Math.max(1, page);
  }

  function resetTransactionPage(): void {
    transactionPage.value = 1;
  }

  function openBeneficiaryForm(): void {
    isAddingBeneficiary.value = true;
  }

  function closeBeneficiaryForm(): void {
    isAddingBeneficiary.value = false;
  }

  return {
    transactionPage,
    isAddingBeneficiary,
    setTransactionPage,
    resetTransactionPage,
    openBeneficiaryForm,
    closeBeneficiaryForm,
  };
});
