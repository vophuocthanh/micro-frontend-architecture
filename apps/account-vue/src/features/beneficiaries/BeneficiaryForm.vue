<script setup lang="ts">
import type { CreateBeneficiaryRequest } from '@banking/contracts';
import { computed, reactive, ref } from 'vue';

import { useCreateBeneficiary } from '../../composables/use-account-queries';
import { ApiError } from '../../services/api-client';

const emit = defineEmits<{ done: [] }>();

const form = reactive({ fullName: '', accountNumber: '', bankName: '' });
const touched = reactive({ fullName: false, accountNumber: false, bankName: false });

/**
 * The same allowlist the API enforces, restated here.
 *
 * Client validation exists to give fast feedback, not to protect anything —
 * the server re-runs every rule, because a browser is not a trust boundary.
 */
const errors = computed(() => ({
  fullName: form.fullName.trim().length < 2 ? 'Enter the payee’s full name.' : null,
  accountNumber: /^\d{8,20}$/.test(form.accountNumber)
    ? null
    : 'Account number must be 8 to 20 digits.',
  bankName: form.bankName.trim().length < 2 ? 'Enter the bank name.' : null,
}));

const isValid = computed(() => Object.values(errors.value).every((error) => error === null));

const mutation = useCreateBeneficiary();
const submitError = ref<string | null>(null);

function showError(field: keyof typeof touched): string | null {
  return touched[field] ? errors.value[field] : null;
}

function submit(): void {
  touched.fullName = true;
  touched.accountNumber = true;
  touched.bankName = true;
  submitError.value = null;

  if (!isValid.value) return;

  const payload: CreateBeneficiaryRequest = {
    fullName: form.fullName.trim(),
    accountNumber: form.accountNumber,
    bankName: form.bankName.trim(),
    currency: 'USD',
  };

  mutation.mutate(payload, {
    onSuccess: () => emit('done'),
    onError: (error) => {
      submitError.value =
        error instanceof ApiError && error.code === 'CONFLICT'
          ? 'A payee with this account number already exists.'
          : 'Could not add this payee. Please try again.';
    },
  });
}
</script>

<template>
  <form class="form" novalidate @submit.prevent="submit">
    <div class="field">
      <label for="beneficiary-name">Full name</label>
      <input
        id="beneficiary-name"
        v-model="form.fullName"
        type="text"
        autocomplete="name"
        :aria-invalid="showError('fullName') !== null"
        :aria-describedby="showError('fullName') ? 'beneficiary-name-error' : undefined"
        @blur="touched.fullName = true"
      />
      <p v-if="showError('fullName')" id="beneficiary-name-error" class="error">
        {{ showError('fullName') }}
      </p>
    </div>

    <div class="field">
      <label for="beneficiary-account">Account number</label>
      <input
        id="beneficiary-account"
        v-model="form.accountNumber"
        type="text"
        inputmode="numeric"
        :aria-invalid="showError('accountNumber') !== null"
        :aria-describedby="showError('accountNumber') ? 'beneficiary-account-error' : undefined"
        @blur="touched.accountNumber = true"
      />
      <p v-if="showError('accountNumber')" id="beneficiary-account-error" class="error">
        {{ showError('accountNumber') }}
      </p>
    </div>

    <div class="field">
      <label for="beneficiary-bank">Bank</label>
      <input
        id="beneficiary-bank"
        v-model="form.bankName"
        type="text"
        :aria-invalid="showError('bankName') !== null"
        :aria-describedby="showError('bankName') ? 'beneficiary-bank-error' : undefined"
        @blur="touched.bankName = true"
      />
      <p v-if="showError('bankName')" id="beneficiary-bank-error" class="error">
        {{ showError('bankName') }}
      </p>
    </div>

    <p v-if="submitError" class="error form-error" role="alert">{{ submitError }}</p>

    <div class="actions">
      <button type="button" class="ghost" @click="emit('done')">Cancel</button>
      <button type="submit" class="primary" :disabled="mutation.isPending.value">
        {{ mutation.isPending.value ? 'Adding…' : 'Add payee' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem 0 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}

input {
  padding: 0.5rem 0.625rem;
  font: inherit;
  font-size: 0.875rem;
  color: #0f172a;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
}

input:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: -1px;
}

input[aria-invalid='true'] {
  border-color: #dc2626;
}

.error {
  margin: 0;
  font-size: 0.75rem;
  color: #b91c1c;
}

.form-error {
  font-size: 0.8125rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 0.875rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
}

.primary {
  color: #ffffff;
  background: #1d4ed8;
  border: 1px solid #1d4ed8;
}

.primary:disabled {
  background: #93c5fd;
  border-color: #93c5fd;
  cursor: progress;
}

.ghost {
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

button:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}
</style>
