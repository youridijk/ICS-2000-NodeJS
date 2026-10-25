import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**']),
  {
    files: ['src/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      quotes: ['warn', 'single'],
      indent: ['warn', 2, {SwitchCase: 1}],
      'comma-dangle': ['warn', 'always-multiline'],
      eqeqeq: ['warn', 'allow-null'],
      curly: ['warn', 'all'],
      'brace-style': ['warn'],
      'prefer-arrow-callback': ['warn'],
      'max-len': ['warn', 140],
      'comma-spacing': ['error'],
      'no-multi-spaces': ['warn', {ignoreEOLComments: true}],
      'lines-between-class-members': ['warn', 'always', {exceptAfterSingleLine: true}],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
]);
