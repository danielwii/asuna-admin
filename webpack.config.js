/* jshint esversion: 6 */
const path = require('path');
const glob = require('glob');
const _ = require('lodash');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const SizePlugin = require('size-plugin');

const tsconfigPathsPlugin = new TsconfigPathsPlugin({
  /* configFile: "./path/to/tsconfig.json" */
});

function getEntries(pattern) {
  const entries = {};

  glob.sync(pattern).forEach(file => {
    entries[file.replace('src/', '')] = path.join(__dirname, file);
  });

  console.log('[entries]', { pattern, entries });

  return entries;
}

module.exports = {
  entry: getEntries('src/**/*.ts*'),
  // entry: path.resolve(__dirname, 'src'),
  // devtool: 'source-map',
  // devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    // library: '',
    // libraryTarget: 'umd',
    // libraryTarget: 'commonjs',
    libraryTarget: 'commonjs2',
    // globalObject: 'this',
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    plugins: [tsconfigPathsPlugin],
  },
  module: {
    rules: [
      // { test: /\.ts$/, loader: 'ts-loader' },
      // { test: /\.tsx$/, loader: 'babel-loader!ts-loader' },

      // https://github.com/zeit/styled-jsx/issues/479
      // { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },

      { test: /\.tsx?$/, loader: 'babel-loader!ts-loader' },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, use: ['source-map-loader'], enforce: 'pre' },

      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: ['next/babel', '@zeit/next-typescript/babel'],
        },
      },
      // {
      //   test: /\.css$/,
      //   use: ['style-loader', 'css-loader'],
      // },
    ],
  },
  // When importing a module whose path matches one of the following, just
  // assume a corresponding global variable exists and use that instead.
  // This is important because it allows us to avoid bundling all of our
  // dependencies, which allows browsers to cache those libraries between builds.
  externals: [nodeExternals()],
  // externals: {
  //   react: 'React',
  //   'react-dom': 'ReactDOM',
  //   debug: 'debug',
  // },
  plugins: [new SizePlugin()],
};
