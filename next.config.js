const webpack              = require('webpack');
const Jarvis               = require('webpack-jarvis');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const jarvis               = new Jarvis({ port: 1337 });
const bundleAnalyzerPlugin = new BundleAnalyzerPlugin({ openAnalyzer: false });

module.exports = {
  webpack: (config, options) => {
    console.log('> Options is', options);
    config.plugins = config.plugins || [];
    if (!options.dev) {
      config.devtool = 'source-map';

      // https://github.com/zeit/next.js/issues/1582
      config.plugins = config.plugins.filter(plugin => {
        return plugin.constructor.name !== 'UglifyJsPlugin';
      });
    } else {
      config.plugins.push(jarvis);
      config.plugins.push(bundleAnalyzerPlugin);

    }

    // Fixes npm packages that depend on `fs` module
    config.node = { fs: 'empty' };

    config.module.rules.push({
      test: /\.css$/, use: [{
        loader : 'postcss-loader',
        options: {
          plugins: function () {
            return [
              require('postcss-import')(),
              require('autoprefixer')()
            ];
          }
        }
      }]
    });

    // https://github.com/moment/moment/issues/2517
    config.plugins.push(new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /zh/));

    // fix `react-dom/server could not be resolved` issue in next v5.0.0
    // delete config.resolve.alias['react-dom'];

    return config;
  },
};
