// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-restricted-syntax */
module.exports = (api) => {
  api.cache.never();

  return {
    presets: [
      [
        'next/babel',
        {
          'preset-env': {},
          'transform-runtime': {},
          'styled-jsx': {},
          'class-properties': {},
        },
      ],
      '@emotion/babel-preset-css-prop',
    ],
    plugins: [
      'babel-plugin-styled-components',
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      // fix Error: StyleSheet: `insertRule` accepts only strings
      // ['styled-components', { ssr: true, displayName: true, preprocess: false }],
      ['import', { libraryName: 'antd', style: false }, 'import-antd'],
      // [
      //   'import',
      //   // { libraryName: '@material-ui/core', customName: name => { return `test/lib/${name}`; } },
      //   // { libraryName: '@material-ui/core', libraryDirectory: '', camel2DashComponentName: false },
      // ],
      // [
      //   'import',
      //   { libraryName: 'lodash', libraryDirectory: '', camel2DashComponentName: false },
      //   'import-lodash',
      // ],
      [
        'module-resolver',
        {
          root: ['src', 'lib/esm'],
          alias: { '@asuna-admin': '.' },
          resolvePath(sourcePath, currentFile, opts) {
            for (const prefix of Object.keys(opts.alias)) {
              if (sourcePath.startsWith(prefix)) {
                for (const root of opts.root) {
                  if (currentFile.includes(root)) {
                    // console.log({ prefix, root, sourcePath, currentFile });

                    const current = currentFile.slice(currentFile.indexOf(root) + root.length + 1);
                    const distance = current.match(/\//g).length;

                    const relatedPrefix = new Array(distance).fill('../').join('');

                    const resolved = relatedPrefix + sourcePath.slice(prefix.length + 1);

                    // console.log({ current, resolved, relatedPrefix });
                    return resolved;
                  }
                }
              }
            }

            return sourcePath;
          },
        },
      ],
    ],
    comments: false,
    compact: 'auto',
  };
};
