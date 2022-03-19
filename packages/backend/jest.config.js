module.exports = {
  verbose: true,
  rootDir: 'src/infrastructure/tests',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**'],
  coverageReporters: ['text', 'json'],
  preset: 'ts-jest',
}
