// const ringConfig = require('@jetbrains/ring-ui/webpack.config').config;

// const TSDocgenPlugin = require('react-docgen-typescript-webpack-plugin');
module.exports = (baseConfig, env, config) => {
  // const cssRule =
  //   config.module.rules[
  //     config.module.rules.findIndex(rule => rule.test.toString().includes('css'))
  //   ];
  // cssRule.exclude = /@jetbrains/;
  // console.log(config.module.rules, config.module.rules.findIndex(rule => rule.test.toString().includes('css')));
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    loader: require.resolve('babel-loader'),
  });
  // config.module.rules.push(...ringConfig.module.rules);
  // config.plugins.push(new TSDocgenPlugin()); // optional
  config.resolve.extensions.push('.ts', '.tsx');

  config.node = { fs: 'empty' };

  return config;
};
