import path from 'path';
import url  from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export default (env => {
    env = env || {};
    if(env.es6 || env.module) {
        // build for ES6 module type definition/import
        console.log("building for ES6 module exposure");
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
                filename:     'dist/[name].mjs'
            }, 
            module: {}, 
            optimization: {
                concatenateModules: true, 
                minimize: false
            }
        };
    } else if(env.commonjs || env.cjs) {
        // built for CommonJS module definition/import
        console.log("building for CommonJS exposure");
        return {
            mode: 'production', 
            entry: {
                templatize: "./templatize.js"
            }, 
            output: {
                library: {
                    name:   'Templatize', 
                    type:   'commonjs', 
                    export: 'default'
                }, 
                globalObject: 'this', 
                path:         path.resolve(__dirname), 
                filename:     'dist/[name].cjs'
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
                minimize: false
            }
        };
    } else if(env.umd) {
        // UMD so supports CommonJS, AMD, and global importing
        console.log("building for UMD exposure");
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
                filename:     'dist/[name].umd.js'
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
        // global type build
        console.log("building for global exposure");
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
                filename:     'dist/[name].min.js'
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
    } else {
        console.log("Environment/exposure type not specified or unrecognized (es6|cjs|umd|min)");
    }
});