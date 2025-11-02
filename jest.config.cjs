module.exports = {
  // Root-level Jest config for monorepo packages
  rootDir: '.',
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.vue$': '@vue/vue3-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'vue', 'json', 'node'],
  testMatch: ['<rootDir>/packages/**/__tests__/**/*.[jt]s?(x)', '<rootDir>/packages/**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^vue$': '<rootDir>/node_modules/vue/dist/vue.cjs.js',
    '^@vue/test-utils$': '<rootDir>/node_modules/@vue/test-utils/dist/vue-test-utils.cjs.js',
    '^@password2d/core$': '<rootDir>/packages/core/dist/index.js'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
}
