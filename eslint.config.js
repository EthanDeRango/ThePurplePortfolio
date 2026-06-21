import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  // PurplePortfolio.jsx is the legacy single-file monolith — dead code, not linted.
  { ignores: ['dist/**', 'node_modules/**', 'src/PurplePortfolio.jsx'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // We use the automatic JSX runtime and don't use prop-types.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Stylistic, not a bug — apostrophes in copy are intentional.
      'react/no-unescaped-entities': 'off',
      // Surface unused code as warnings (don't fail the gate); allow Capitalized/underscore on purpose.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]' }],
      // The valuable gate: real hook violations are errors; dependency hints are warnings.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // Test files get the vitest/jest-dom globals.
  {
    files: ['**/*.test.{js,jsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.vitest } },
  },
];
