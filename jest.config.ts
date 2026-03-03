import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: ['.*\\.spec\\.ts$', '.*\\.test\\.ts$'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts', '!**/node_modules/**'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  // unit tests should not include integration files
  testPathIgnorePatterns: ['.*\\.integration\\.test\\.ts$', '.*\\.integration\\.spec\\.ts$'],
  moduleNameMapper: {
    '^@enocean/common(.*)$': '<rootDir>/libs/common/src$1',
    '^@enocean/testing(.*)$': '<rootDir>/libs/testing/src$1',
  },
};

export default config;
