require('node-minify').minify({
    compressor: 'uglifyjs',
    input: ['./src/templatize.js'],
    output: './dist/templatize.min.js',
    callback: function (err, min) {
        if(err) return console.log(err);
    }
});