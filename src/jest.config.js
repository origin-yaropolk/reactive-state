import base from '../jest.config.js';

export default {
	...base,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: true,

	collectCoverageFrom: ['**/*.ts'],

	coveragePathIgnorePatterns: [
		'src/reactive-state.ts',
	],

	// The directory where Jest should output its coverage files
	coverageDirectory: '<rootDir>/../coverage',

	// Indicates which provider should be used to instrument code for coverage
	coverageProvider: 'v8',

	// An object that configures minimum threshold enforcement for coverage results
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
};
