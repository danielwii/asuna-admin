const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    helpers: path.resolve(__dirname, 'helpers'),
    store: path.resolve(__dirname, 'store'),
    common: path.resolve(__dirname, 'common'),
    adapters: path.resolve(__dirname, 'adapters'),
    // components_snow: path.resolve(__dirname, 'components/snow'),
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, './dist'),
    // filename: 'index.js',
    library: '',
    libraryTarget: 'commonjs',
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    alias: {
      '@asuna-admin/store': path.resolve(__dirname, 'store/'),
    },
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.ts$/, loader: 'ts-loader' },
      { test: /\.tsx$/, loader: 'babel-loader!ts-loader' },

      // https://github.com/zeit/styled-jsx/issues/479
      // { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },

      {
        test: /\.js$/,
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
};
