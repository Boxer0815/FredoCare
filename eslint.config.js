// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      // TypeScript handles namespace/import checks; the eslint-plugin-import
      // resolver is incompatible with this TypeScript version.
      'import/namespace': 'off',
      // Calling async data-loading functions from effects is a standard
      // React pattern; this rule produces false positives here.
      'react-hooks/set-state-in-effect': 'off',
    },
  }
]);
