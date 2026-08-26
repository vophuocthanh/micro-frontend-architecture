<script setup lang="ts">
import { computed } from 'vue';

import { ApiError } from '../services/api-client';

const props = defineProps<{
  state: 'loading' | 'empty' | 'error';
  label: string;
  description?: string;
  error?: Error | null;
}>();

const emit = defineEmits<{ retry: [] }>();

/** Turns a transport failure into something a customer can act on. */
const message = computed(() => {
  if (props.state !== 'error') return props.description ?? '';

  const error = props.error;
  if (!(error instanceof ApiError)) {
    return 'We could not reach the account service. Check your connection and try again.';
  }

  switch (error.code) {
    case 'FORBIDDEN':
      return 'Your role does not include access to this information.';
    case 'NOT_FOUND':
      return 'This account no longer exists or was closed.';
    case 'RATE_LIMITED':
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return error.message;
  }
});

const requestId = computed(() => (props.error instanceof ApiError ? props.error.requestId : null));
</script>

<template>
  <div v-if="state === 'loading'" class="block" role="status" aria-live="polite" aria-busy="true">
    <span class="sr-only">{{ label }}</span>
    <span v-for="row in 3" :key="row" class="skeleton" aria-hidden="true" />
  </div>

  <div v-else-if="state === 'empty'" class="block">
    <p class="title">{{ label }}</p>
    <p class="description">{{ description }}</p>
  </div>

  <div v-else class="block error" role="alert">
    <p class="title">{{ label }}</p>
    <p class="description">{{ message }}</p>
    <span v-if="requestId" class="request-id">Request {{ requestId }}</span>
    <button type="button" class="retry" @click="emit('retry')">Try again</button>
  </div>
</template>

<style scoped>
.block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  text-align: center;
  color: #64748b;
}

.title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #334155;
}

.error .title {
  color: #b91c1c;
}

.description {
  margin: 0;
  max-width: 34ch;
  font-size: 0.875rem;
}

.request-id {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  color: #94a3b8;
}

.retry {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  cursor: pointer;
}

.retry:hover {
  background: #dbeafe;
}

.retry:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}

.skeleton {
  width: 100%;
  height: 1rem;
  border-radius: 0.375rem;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
