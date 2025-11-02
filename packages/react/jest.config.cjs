const path = require('path')
const createBase = require('../../jest.base.cjs')

const cfg = createBase({
  tsJestPath: require.resolve('ts-jest'),
  // react package doesn't need vue-jest
  repoRoot: path.resolve(__dirname)
})

// Keep the React package focused on its src tests and setup file
cfg.roots = ['<rootDir>/src']
cfg.setupFilesAfterEnv = ['<rootDir>/src/setupTests.ts']
cfg.testMatch = ['<rootDir>/src/__tests__/**/*.[jt]s?(x)', '<rootDir>/src/?(*.)+(spec|test).[jt]s?(x)']

// Use ts-jest preset to avoid deprecated globals usage warnings
cfg.preset = 'ts-jest'

module.exports = cfg
