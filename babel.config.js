module.exports = {
  "ignore": ["./node_modules/react-native/", "./node_modules/react/", "./node_modules/@babel/**/*"],
  "presets": [
    "@babel/env",
    "@babel/typescript"
  ],
  "plugins": [
    ["@babel/proposal-class-properties"],
    ["@babel/proposal-object-rest-spread"],
    ["module-resolver", {
      "root": ["./src/", "./node_modules/"],
      "exclude": ["./node_modules/react-native/", "./node_modules/react/", "./node_modules/@babel/"],
      "alias": {
        "crypto": "react-native-crypto",
        "stream": "stream-browserify"
      }
    }]
  ]
}
