const path = require('path')
const configs = require('./app/configs/')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const {CleanWebpackPlugin} =require('clean-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
module.exports = env => {

    return {
        watch: false,

        target: 'electron',

        entry: './app/src/entry.js',

        output: {
            path: path.resolve(__dirname, `${configs.dest}`),
            publicPath: configs.publicPath,
            filename: 'js/[name].js',
            libraryTarget:'umd'
        },
        externals: {
            'vue': 'Vue',
            'vue-router': 'VueRouter',
            'iview': 'iView',
            'vue-i18n':'VueI18n'
        },
        module: {
            loaders: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    test: /\.(png|jpg|gif|svg)$/,
                    loader: 'file-loader',
                    query: {
                        name: 'images/[name].[ext]'
                    }
                },
                {
                    test: /\.node$/,
                    loader: 'node-loader'
                }
            ]
        },
        // optimization: {
        //     runtimeChunk: 'single'//解决hash值配置引起来的问题
        // },
        plugins: [
            // 打包环境配置  development、production，testing
        //  new webpack.DefinePlugin({
        //         'process.env': {
        //             NODE_ENV: JSON.stringify(env.NODE_ENV)
        //         }
        //     }),
            new CleanWebpackPlugin(),
            // new BundleAnalyzerPlugin(),
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'template/index.html'),
                filename: './index.html',
                title: configs.title,
                hash: true,
                minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: true
                }
            }),
            new CopyWebpackPlugin([
                {
                    from: __dirname + '/app/language.json'
                },
                {
                    from: __dirname + '/app/lanList.json'
                }
            ])
        ],

        resolve: {
            alias: {
                'vue$': 'vue/dist/vue.js'
            },
            extensions: ['.js', '.vue', '.json']
        }
    }
}