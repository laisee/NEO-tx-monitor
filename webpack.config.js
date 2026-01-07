const path = require('path');

module.exports = {
  target: 'node',
  mode: process.env.NODE_ENV || 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
    clean: true
  },
  resolve: {
    extensions: ['.js', '.json']
  },
  externals: {
    express: 'commonjs express'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  optimization: {
    minimize: false
  }
};

