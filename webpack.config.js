const webpack  = require('webpack'), 
      path     = require('path'), 
      fs       = require('fs');

module.exports = {
    mode: 'production', 
    entry: {
        'Templatize': './src/templatize.js'
    }, 
    output: {
        library: '[name]', 
        libraryTarget: 'umd', 
        libraryExport: 'default', 
        path: path.join(path.resolve(__dirname), "dist"), 
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