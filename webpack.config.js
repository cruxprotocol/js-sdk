const path = require('path');

module.exports = {
    entry: './src/index.ts',
    module: {
        rules: [
            {
                use: {
                    loader: 'babel-loader',
                    options: {
                        "ignore": ["./node_modules/react-native/", "./node_modules/react/", "./node_modules/@babel/"],
                        "presets": [
                            "@babel/env",
                            "@babel/typescript"
                        ],
                        "plugins": [
                            ["@babel/proposal-class-properties"],
                            ["@babel/proposal-object-rest-spread"],
                            ["module-resolver", {
                                "root": ["./src/", "./node_modules/"],
                                "exclude": [],
                                "alias": {
                                    "crypto": "react-native-crypto",
                                    "stream": "stream-browserify"
                                }
                            }]
                        ]
                    },
                }
            }
        ]
    },
    externals: {
        'react': 'umd react',
        'react-dom': 'umd react-dom',
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
