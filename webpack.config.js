import path from 'path';
import url  from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default (env => {
    env = env || {};
    if(env.es6 || env.module) {
        return {
            experiments: {
                outputModule: true,
            }, 
            mode: 'production', 
            entry: {
                templatize: "./templatize.js"
            }, 
            output: {
                library: {type: 'module'}, 
                globalObject: 'this', 
                path:         path.resolve(__dirname), 
                filename:     '[name].es6.mjs'
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
    } else if(env.umd) {
        return {
            mode: 'production', 
            entry: {
                templatize: "./templatize.js"
            }, 
            output: {
                library: {
                    name:   'Templatize', 
                    type:   'umd', 
                    export: 'default'
                }, 
                globalObject: 'this', 
                path:         path.resolve(__dirname), 
                filename:     '[name].umd.cjs'
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
    } else if(env.global || env.min) {
        return {
            mode: 'production', 
            entry: {
                templatize: "./templatize.js"
            }, 
            output: {
                library: {
                    name:   'Templatize', 
                    type:   'global', 
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
    }
});