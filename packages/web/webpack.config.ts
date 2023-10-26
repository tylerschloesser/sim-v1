import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { Configuration } from 'webpack'
import 'webpack-dev-server'
import { WebpackManifestPlugin } from 'webpack-manifest-plugin'

export default (_env: unknown, argv: { mode: Configuration['mode'] }) => {
  const prod = argv.mode !== 'development'
  const mode = prod ? 'production' : 'development'

  const config: Configuration = {
    stats: 'minimal',
    mode,
    entry: './src/index.tsx',
    devtool: prod ? 'source-map' : 'eval-source-map',
    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].chunk.js',
      clean: true,
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[local]--[hash:base64:5]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [['postcss-preset-env']],
                },
              },
            },
            'sass-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      extensionAlias: {
        '.js': ['.ts', '.tsx', '.js'],
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.[contenthash].html',
        template: './src/index.html',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'app.webmanifest',
          },
        ],
      }),
      new WebpackManifestPlugin({}),
    ],
    devServer: {
      hot: false,
      watchFiles: ['./src/index.html'],
      historyApiFallback: true,
      allowedHosts: ['.amazonaws.com'],
    },
  }
  return config
}
