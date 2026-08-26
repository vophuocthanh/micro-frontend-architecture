import { bootstrapDashboard } from './bootstrap';
import { createStandaloneContext } from './dev/standalone-context';
import './styles/standalone.css';

/**
 * Standalone entry. It calls `bootstrapDashboard` directly rather than going
 * through `mount.tsx`, so the federated boundary has exactly one consumer.
 */
const container = document.querySelector<HTMLElement>('#dashboard-root');

if (!container) {
  throw new Error('#dashboard-root is missing from index.html');
}

createStandaloneContext()
  .then((context) => bootstrapDashboard(container, context))
  .catch((error: unknown) => {
    container.textContent = error instanceof Error ? error.message : 'Failed to start standalone mode';
  });
