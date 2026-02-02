const ECMA_VERSION = 2022;

module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: ECMA_VERSION,
    sourceType: 'module',
  },
  rules: {
    'no-console': 'off', // Permis car on utilise un logger personnalisé
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/tests/**/*.js'],
      env: {
        jest: true,
      },
    },
  ],
};
