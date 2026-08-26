import { bootstrapAccount } from './bootstrap';
import { createStandaloneContext } from './dev/standalone-context';
import './styles/standalone.css';

/**
 * Standalone entry. It calls `bootstrapAccount` directly rather than going
 * through `mount.ts`, so the federated boundary has exactly one consumer.
 */
const container = document.querySelector<HTMLElement>('#account-root');

if (!container) {
  throw new Error('#account-root is missing from index.html');
}

createStandaloneContext()
  .then((context) => bootstrapAccount(container, context))
  .catch((error: unknown) => {
    container.textContent =
      error instanceof Error ? error.message : 'Failed to start standalone mode';
  });
