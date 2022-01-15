const webpack  = require('webpack'), 
      path     = require('path');

module.exports = {
    mode: 'production', 
    entry: {
        templatize: './templatize.js'
    }, 
    output: {
        library: {
            name:   'Templatize', 
            type:   'umd', 
            export: 'default'
        }, 
        globalObject: 'this', 
        path:         path.resolve(__dirname), 
        filename:     '[name].min.js'
    },
    module: {
        rules: [
            {
                test:    /\.js$/,
                exclude: /(node_modules)/,
                loader:  'babel-loader', 
                options: {presets: ['@babel/preset-env']}
            }
        ]
    }, 
    optimization: {
        concatenateModules: true, 
        minimize: true
    }
};