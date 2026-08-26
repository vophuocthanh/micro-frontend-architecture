<script setup lang="ts">
defineProps<{
  title: string;
  hint?: string;
}>();
</script>

<template>
  <section class="panel" :aria-label="title">
    <header class="header">
      <h3 class="title">{{ title }}</h3>
      <span v-if="hint" class="hint">{{ hint }}</span>
    </header>
    <div class="body">
      <slot />
    </div>
  </section>
</template>

<!--
  `scoped` is this remote's CSS isolation strategy.

  Vue adds a per-component data attribute and rewrites every selector to match
  it, so `.title` here can never reach the React remote's `.title` — the
  isolation is enforced by the compiler rather than by a naming convention
  everyone has to remember.
-->
<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.875rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
}

.header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem 0.75rem;
}

.title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.hint {
  font-size: 0.8125rem;
  color: #64748b;
}

.body {
  flex: 1;
  padding: 0 1.25rem 1.25rem;
}
</style>
