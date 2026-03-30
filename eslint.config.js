import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    ignores: ['node_modules/**', 'dist/**', '*.config.js']
  },
  ...vuePlugin.configs['flat/essential'],
  ...vuePlugin.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        parser: tsParser
      }
    },
    plugins: {
      vue: vuePlugin,
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...vuePlugin.configs['flat/recommended'].rules,
      ...prettierConfig.rules,
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': ['error', {
        semi: false,
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        trailingComma: 'none',
        arrowParens: 'avoid',
        endOfLine: 'lf'
      }]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...prettierConfig.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'prettier/prettier': ['error', {
        semi: false,
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        trailingComma: 'none',
        arrowParens: 'avoid',
        endOfLine: 'lf'
      }]
    }
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    rules: {
      'prettier/prettier': ['error', {
        semi: false,
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        trailingComma: 'none',
        arrowParens: 'avoid',
        endOfLine: 'lf'
      }]
    },
    plugins: {
      prettier: prettierPlugin
    }
  }
]
