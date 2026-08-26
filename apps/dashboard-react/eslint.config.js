import base from '@banking/config/eslint/base';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // The rule that actually prevents bugs here: a missing dependency in the
      // effect that mounts platform-event listeners produces stale closures
      // that silently stop reacting.
      ...reactHooks.configs.recommended.rules,
    },
  },
];
