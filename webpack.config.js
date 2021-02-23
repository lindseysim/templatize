const webpack  = require('webpack'), 
      path     = require('path'), 
      fs       = require('fs');

module.exports = {
    mode: 'production', 
    entry: {
        'Templatize': './templatize.js'
    }, 
    output: {
        library: '[name]', 
        libraryTarget: 'umd', 
        libraryExport: 'default', 
        path: path.resolve(__dirname), 
        filename: '[name].min.js'
    },
    module: {
        rules: [
            {
                test:    /\.js$/,
                exclude: /(node_modules)/,
                loader:  'babel-loader', 
                query: {
                    presets: ['@babel/preset-env']
                }
            }
        ]
    }, 
    optimization: {
        concatenateModules: true, 
        minimize: false
    }
};