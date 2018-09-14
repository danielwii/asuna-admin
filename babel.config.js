/* eslint-disable no-restricted-syntax */
module.exports = api => {
  api.cache.never();

  return {
    presets: ['@babel/preset-typescript', '@babel/preset-env'],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-transform-runtime',
      ['styled-components', { ssr: true, displayName: true, preprocess: false }],
      ['import', { libraryName: 'antd', style: false }, 'import-antd'],
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

                    const relatedPrefix = Array(distance)
                      .fill('../')
                      .join('');

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
