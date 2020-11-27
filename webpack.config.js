const path = require('path');
module.exports = {
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    devServer: {
        filename: 'bundle.js',
        publicPath: '/dist/'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, '/dist'),
    }
};
