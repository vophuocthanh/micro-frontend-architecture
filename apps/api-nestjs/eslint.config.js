import base from '@banking/config/eslint/base';

export default [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      /**
       * Off, and it must stay off.
       *
       * Nest builds its dependency graph from `design:paramtypes` metadata,
       * which the compiler emits from constructor parameter *types*. Rewriting
       * `import { PrismaService }` to `import type { PrismaService }` erases the
       * import, the metadata becomes `undefined`, and every affected provider
       * fails to resolve at runtime. Auto-fixing this rule here would be a
       * silent, application-wide breakage.
       */
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
];
