const path = require('path');
const nodeExternals = require('webpack-node-externals');
module.exports = {
    entry: path.resolve(__dirname, '..', 'server/index.js'),
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        publicPath: '/dist/',
        filename: 'server.js',
        library: 'app',
        libraryTarget: 'commonjs2'
    },
    devServer: {
        contentBase: path.resolve(__dirname, '..', '/'),
        publicPath: '/dist/'
    },
    resolve: {
        extensions: ['.js'],
        alias: {
            components: path.resolve(__dirname, '..', 'components'),
        }
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react', 'stage-0']
                }
            },
            {
                test: /\.scss$/,
                use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
            },
            {
                test: /\.(ttf|eot|otf|svg|png)$/,
                loader: 'file-loader'
            },
            {
                test: /\.(woff|woff2)$/,
                loader: 'url-loader'
            }
        ]
    }
};
