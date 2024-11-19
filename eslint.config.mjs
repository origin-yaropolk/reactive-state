// @ts-check

import gitIgnore from 'eslint-config-flat-gitignore';
import js from '@eslint/js';
import ts from 'typescript-eslint';

export default ts.config(
	js.configs.all,
	...ts.configs.recommendedTypeChecked,
	gitIgnore(),
	{
		rules: {
			'array-element-newline': ['error', 'consistent'],
			'arrow-parens': ['error', 'as-needed'],
			'capitalized-comments': 'off',
			'comma-dangle': ['error', 'always-multiline'],
			'dot-location': 'off',
			'dot-notation': 'off',
			'func-style': 'off',
			'function-call-argument-newline': ['error', 'consistent'],
			'function-paren-newline': 'off',
			'id-length': 'off',
			'implicit-arrow-linebreak': 'off',
			'indent': ['error', 'tab'],
			'lines-around-comment': 'off',
			'lines-between-class-members': 'off',
			'max-len': ['error', 160],
			'max-lines-per-function': ['error', 100],
			'max-statements': ['error', 20],
			'multiline-comment-style': 'off',
			'multiline-ternary': 'off',
			'no-confusing-arrow': 'off',
			'no-console': 'off',
			'no-extra-parens': 'off',
			'no-magic-numbers': 'off',
			'no-plusplus': 'off',
			'no-shadow': 'off',
			'no-tabs': 'off',
			'no-ternary': 'off',
			'no-undefined': 'off',
			'no-undef-init': 'off',
			'no-underscore-dangle': 'off',
			'object-curly-spacing': ['error', 'always'],
			'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
			'one-var': ['error', 'never'],
			'operator-linebreak': ['error', 'after'],
			'padded-blocks': ['error', 'never'],
			'prefer-destructuring': 'off',
			'quote-props': ['error', 'consistent-as-needed'],
			'quotes': ['error', 'single'],
			'sort-imports': ['error', { allowSeparatedGroups: true, ignoreCase: true }],
			'sort-keys': 'off',
			'space-before-function-paren': ['error', 'never'],
		},
	},
	{
		files: [
			'**/*.mts',
		],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			'no-undef': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': 'off',
			'@typescript-eslint/no-use-before-define': ['error', 'nofunc'],
		},
	},
	// disable type-checked rules for non-TS files
	{
		files: [
			'**/*.cjs',
			'**/*.mjs',
		],
		languageOptions: {
			globals: {
				process: 'readonly',
				console: 'readonly',
			},
		},
		extends: [ts.configs.disableTypeChecked],
	},
	// workaround for a too broad sourceType setting in base config:
	// https://github.com/typescript-eslint/typescript-eslint/blob/v7.6.0/packages/typescript-eslint/src/configs/base.ts#L10
	{
		files: [
			'**/*.cjs',
		],
		languageOptions: {
			sourceType: 'commonjs',
		},
	},
);
