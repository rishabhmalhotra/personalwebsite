const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    mode: isProduction ? 'production' : 'development',
    entry: {
      main: './src/js/app.js',
      vendor: ['three'],
    },
    output: {
      path: path.resolve(__dirname, 'dist/js'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      publicPath: '/js/',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: ['@babel/plugin-proposal-class-properties'],
            },
          },
        },
      ],
    },
    resolve: {
      extensions: ['.js'],
      alias: {
        '@': path.resolve(__dirname, 'src/js'),
        '@modules': path.resolve(__dirname, 'src/js/modules'),
        '@config': path.resolve(__dirname, 'config'),
      },
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            priority: 10,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    },
    plugins: [
      new CleanWebpackPlugin(),
    ],
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    stats: {
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    },
  };
}; 