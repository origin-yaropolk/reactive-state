export default {
	// A preset that is used as a base for Jest's configuration
	preset: 'ts-jest/presets/default-esm',

	// Automatically clear mock calls, instances, contexts and results before every test
	clearMocks: true,

	// The number of seconds after which a test is considered as slow and reported as such in the results.
	slowTestThreshold: 10,

	extensionsToTreatAsEsm: ['.ts'],
	resolver: '<rootDir>/../tools/mjs-resolver.cjs',
	moduleFileExtensions: ['ts', 'js', 'mjs', 'mts'],
	testRegex: ['.*.spec.ts'],
	transform: {
		// to process mts with `ts-jest`
		'^.+\\.ts$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
};
