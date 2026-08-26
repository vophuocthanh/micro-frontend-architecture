import { bootstrapTransfer } from './bootstrap';
import { createStandaloneContext } from './dev/standalone-context';
import './styles/standalone.css';

/**
 * Standalone entry. It calls `bootstrapTransfer` directly rather than going
 * through `mount.ts`, so the federated boundary has exactly one consumer.
 */
const container = document.querySelector<HTMLElement>('#transfer-root');

if (!container) {
  throw new Error('#transfer-root is missing from index.html');
}

createStandaloneContext()
  .then((context) => bootstrapTransfer(container, context))
  .catch((error: unknown) => {
    container.textContent =
      error instanceof Error ? error.message : 'Failed to start standalone mode';
  });
