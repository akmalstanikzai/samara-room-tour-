const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const HashOutput = require('webpack-plugin-hash-output');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

//dev
module.exports = {
  entry: `${__dirname}/src/app.js`,
  output: {
    path: __dirname + '/build',
    filename: 'bundle.js',
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'build'),
    port: 9000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html', // name of html file to be created
      template: './src/index.html', // source from which html file would be created
    }),
    new CopyWebpackPlugin([
      {
        from: 'static',
      },
    ]),
  ],
  module: {
    rules: [
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ['raw-loader', 'glslify-loader'],
      },
    ],
  },
};
//prod
if (process.env.NODE_ENV === 'prod') {
  module.exports = {
    entry: `${__dirname}/src/app.js`,
    output: {
      path: __dirname + '/build',
      // filename: 'bundle.[chunkhash].js',
      filename: 'samara_backyard_3d.js',
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HashOutput(),
      new HtmlWebpackPlugin({
        filename: 'index.html', // name of html file to be created
        template: './src/index.html', // source from which html file would be created
      }),
      new CopyWebpackPlugin([
        {
          from: 'static',
        },
      ]),
    ],
    module: {
      rules: [
        {
          test: /\.html$/i,
          loader: 'html-loader',
          options: {
            minimize: true,
            interpolation: false,
          },
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          query: {
            plugins: ['@babel/transform-arrow-functions'],
          },
        },
        {
          test: /\.(glsl|vs|fs|vert|frag)$/,
          exclude: /node_modules/,
          use: ['raw-loader', 'glslify-loader'],
        },
      ],
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          parallel: true,
        }),
      ],
    },
  };
}
