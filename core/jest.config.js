// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defaults } = require('ts-jest/presets');

const configs = {
  ...defaults,
  verbose: true,
  globals: {
    'ts-jest': {
      babelConfig: 'babel.config.js',
      // babelConfig: 'babelrc.test.json',
      tsConfig: 'tsconfig.jest.json',
      diagnostics: false,
    },
  },
  moduleNameMapper: {
    '^@asuna-admin/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js',
  },
  // moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  // moduleDirectories: ['node_modules', 'src'],
  testRegex: '.spec.tsx?$',
  // transform: {
  //   '^.+\\.(t|j)sx?$': 'ts-jest',
  //   // '^.+\\.js?$': 'babel-jest',
  // },
  // coverageThreshold: { global: {} },
  collectCoverage: true,
  preset: 'ts-jest',
};

console.log(configs);

module.exports = configs;
