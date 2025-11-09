const path = require('path')
const createBase = require('../../jest.base.cjs')

const cfg = createBase({
	tsJestPath: require.resolve('ts-jest'),
	vueJestPath: require.resolve('@vue/vue3-jest'),
	// rootDir should be package root so node_modules mappings are package-local
	repoRoot: path.resolve(__dirname)
})

// Restrict tests to this package when running package-level jest
cfg.testMatch = ['<rootDir>/src/__tests__/**/*.[jt]s?(x)', '<rootDir>/src/?(*.)+(spec|test).[jt]s?(x)']

// Use ts-jest preset to avoid deprecated globals usage warnings
cfg.preset = 'ts-jest'

module.exports = cfg
