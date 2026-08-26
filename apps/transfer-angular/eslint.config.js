import base from '@banking/config/eslint/base';

export default [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      // Same reason as the API: Angular resolves constructor dependencies from
      // emitted parameter metadata, so a type-only import erases the token.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
