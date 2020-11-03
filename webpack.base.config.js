'use strict'

const path = require('path')
const { DefinePlugin } = require('webpack')

module.exports = {
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    node: {
        __dirname: false,
        __filename: false
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.json']
    },
    devtool: 'source-map',
    watchOptions: {
        ignored: /node_modules/
    },
    plugins: [
        new DefinePlugin({
            APP_VERSION: JSON.stringify(require('./package.json').version),
            APP_DESCRIPTION: JSON.stringify(require('./package.json').description),
            APP_HOMEPAGE: JSON.stringify(require('./package.json').homepage),
            APP_LICENSE: JSON.stringify(require('./package.json').license),
            APP_BUGS_URL: JSON.stringify(require('./package.json').bugs.url)
        })
    ]
}
