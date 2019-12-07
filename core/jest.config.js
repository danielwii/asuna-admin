module.exports = {
  verbose: true,
  globals: {
    'ts-jest': {
      babelConfig: 'babelrc.test.json',
      tsConfig: 'tsconfig.jest.json',
      diagnostics: false,
    },
  },
  moduleNameMapper: {
    '^@asuna-admin/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
  // moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  moduleDirectories: ['node_modules', 'src'],
  testRegex: '.spec.tsx?$',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
    // '^.+\\.js?$': 'babel-jest',
  },
  coverageThreshold: {
    global: {},
  },
  collectCoverage: true,
  preset: 'ts-jest/presets/js-with-ts',
  testMatch: null,
};
