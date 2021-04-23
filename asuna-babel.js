// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-restricted-syntax */
module.exports = (api) => {
  api.cache.never();

  return {
    presets: [
      ['next/babel', { 'preset-env': {}, 'plugin-transform-runtime': {}, 'styled-jsx': {}, 'class-properties': {} }],
      '@emotion/babel-preset-css-prop',
    ],
    plugins: [
      'babel-plugin-styled-components',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-optional-chaining',
      // '@babel/plugin-proposal-private-methods',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      // fix Error: StyleSheet: `insertRule` accepts only strings
      // ['styled-components', { ssr: true, displayName: true, preprocess: false }],
      ['import', { libraryName: 'antd', style: false }, 'import-antd'],
      ['import', { libraryName: '@danielwii/asuna-components', libraryDirectory: 'dist' }, 'import-components'],
      // ['import', { libraryName: '@danielwii/asuna-components-pro', libraryDirectory: 'dist' }, 'import-components-pro'],
    ],
    comments: false,
    compact: 'auto',
  };
};
