// Shared Jest base factory for packages. Call this with package-local resolver
// paths (so require.resolve will resolve from package node_modules).
module.exports = function createBaseConfig({ tsJestPath, vueJestPath, repoRoot }) {
  const transform = {}
  if (tsJestPath) transform['^.+\\.(ts|tsx)$'] = [tsJestPath, { tsconfig: 'tsconfig.json' }]
  if (vueJestPath) transform['^.+\\.vue$'] = vueJestPath

  return {
    rootDir: repoRoot || '.',
    testEnvironment: 'jest-environment-jsdom',
    transform,
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'vue', 'json', 'node'],
    testMatch: ['<rootDir>/packages/**/__tests__/**/*.[jt]s?(x)', '<rootDir>/packages/**/?(*.)+(spec|test).[jt]s?(x)'],
    moduleNameMapper: {
      '^vue$': '<rootDir>/node_modules/vue/dist/vue.cjs.js',
      '^@vue/test-utils$': '<rootDir>/node_modules/@vue/test-utils/dist/vue-test-utils.cjs.js',
      // Map local core relative to package root (../core)
      '^@password2d/core$': '<rootDir>/../core/dist/index.js'
    },
    // ts-jest specific config is provided via the transform array above to avoid
    // the deprecated 'globals.ts-jest' approach.
  }
}
