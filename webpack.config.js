const path = require('path');

module.exports = {
    entry: './javascript/markdown_editor.js',
    output: {
        filename: 'markdown_editor.dist.js',
        path: path.resolve(__dirname, 'javascript'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    mode: 'development',
    devtool: "inline-source-map",
};
