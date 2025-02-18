const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'build/'], // 무시할 폴더 설정
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin, // ✅ CommonJS 방식 유지
    },
    rules: {
      'import/no-unresolved': 'error',
      'import/no-extraneous-dependencies': 'error',
      'import/order': ['error', { alphabetize: { order: 'asc' } }],
    },
  },
];
