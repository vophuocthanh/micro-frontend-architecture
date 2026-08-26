import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Rules every application shares.
 *
 * Framework plugins are layered on top by each app and never added here — a
 * shared config that forced React rules onto the Vue application, or Angular
 * rules onto the API, would be a coupling in the tooling to match the one the
 * architecture works to avoid.
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // `const { maxAge: _maxAge, ...rest } = options` is the standard way
          // to omit a property; flagging the discarded binding would push code
          // towards a mutation or a manual copy instead.
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always'],
    },
  },
);
