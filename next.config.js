const Jarvis               = require('webpack-jarvis');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const jarvis               = new Jarvis({ port: 1337 });
const bundleAnalyzerPlugin = new BundleAnalyzerPlugin();

module.exports = {
  webpack: (config) => {
    // Fixes npm packages that depend on `fs` module
    config.node = { fs: 'empty' };

    config.plugins = config.plugins || [];
    config.plugins.push(jarvis);
    config.plugins.push(bundleAnalyzerPlugin);

    config.module.rules.push({
      test: /\.css$/, use: [{
        loader : 'postcss-loader',
        options: {
          plugins: function () {
            return [
              require('postcss-import')(),
              require("autoprefixer")()
            ]
          }
        }
      }]
    });

    // fix `react-dom/server could not be resolved` issue.
    // delete config.resolve.alias['react-dom'];

    return config;
  },
};
