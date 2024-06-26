const js = require(`@eslint/js`)
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                Atomics: "readonly",
                SharedArrayBuffer: "readonly",
                ...globals.node,
                es6: true,
                es2022:true,
                BigInt: true
            },
            parserOptions: {
                globalReturn: true,
                impliedStrict: true,
                ecmaVersion: 13
            },
            sourceType: "commonjs",
            ecmaVersion: 6
        },
        rules: {
            "no-mixed-spaces-and-tabs": "off",
            "no-irregular-whitespace": "off",
            "no-case-declarations": "off",
            "no-fallthrough": "off",
            "no-empty": "off",
            "no-console": "error",
            "no-unused-vars": "off",
            indent: "off",
            "linebreak-style": "off",
            quotes: [
                "error",
                "backtick"
            ],
            semi: [
                "error",
                "never"
            ]
        }
    }
]