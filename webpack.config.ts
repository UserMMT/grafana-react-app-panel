import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import type { Configuration } from 'webpack';

const config = (env: Record<string, unknown>, argv: { mode?: string }): Configuration => {
  const isProduction = argv.mode === 'production';

  return {
    target: 'web',
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    entry: {
      module: path.resolve(process.cwd(),'src/module.ts'),
    },
    output: {
      path: path.resolve(process.cwd(),'dist'),
      filename: '[name].js',
      // Grafana loads panel plugins as AMD modules via SystemJS.
      libraryTarget: 'amd',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.[tj]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'typescript', tsx: true },
                target: 'es2020',
              },
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    // These are provided by the Grafana host application at runtime and
    // must NOT be bundled into the plugin.
    externals: [
      'react',
      'react-dom',
      'react-dom/client',
      '@grafana/data',
      '@grafana/ui',
      '@grafana/runtime',
      'lodash',
      'moment',
      'jquery',
      'rxjs',
      ({ request }, callback) => {
        const prefix = 'grafana/';
        if (request && request.indexOf(prefix) === 0) {
          return callback(undefined, request.slice(prefix.length));
        }
        callback();
      },
    ],
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: { configFile: path.resolve(process.cwd(),'tsconfig.json') },
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'plugin.json', to: '.' },
          { from: 'README.md', to: '.', noErrorOnMissing: true },
          { from: 'img', to: 'img', noErrorOnMissing: true },
        ],
      }),
    ],
  };
};

export default config;
