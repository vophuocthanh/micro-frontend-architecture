import base from '@banking/config/eslint/base';
import vue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

export default [
  ...base,
  // `essential` rather than `recommended`: the extra rules in `recommended` are
  // attribute ordering and line-break preferences — formatting opinions that
  // belong to a formatter, and that would otherwise bury real findings in noise.
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
  },
];
