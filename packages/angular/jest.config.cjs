const path = require('path')
const createBase = require('../../jest.base.cjs')

const cfg = createBase({
  tsJestPath: require.resolve('ts-jest'),
  // rootDir should be package root so node_modules mappings are package-local
  repoRoot: path.resolve(__dirname)
})

// Keep the Angular package focused on its src tests and setup file
cfg.roots = ['<rootDir>/src']
cfg.setupFilesAfterEnv = ['<rootDir>/setup-jest.ts']

// Show each test name during runs
cfg.verbose = true

// Use the Angular preset for transforms and environment
cfg.preset = 'jest-preset-angular'

// Restrict tests to this package when running package-level jest
cfg.testMatch = ['<rootDir>/src/__tests__/**/*.[jt]s?(x)', '<rootDir>/src/?(*.)+(spec|test).[jt]s?(x)']

cfg.transform = {
  '^.+\\.(ts|js|html)$': [
    'jest-preset-angular',
    {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$',
      diagnostics: {
        ignoreCodes: [151001]
      },
      compilerOptions: {
        module: 'commonjs'
      }
    },
  ],
};

// Add moduleNameMapper for Angular and tslib
cfg.moduleNameMapper = {};

cfg.transformIgnorePatterns = [
  'node_modules/(?!@angular)',
];

module.exports = cfg