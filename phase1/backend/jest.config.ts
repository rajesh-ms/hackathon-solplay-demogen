import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { isolatedModules: true }] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts','!src/**/types.ts'],
  coverageDirectory: 'coverage',
  verbose: false
};
export default config;
