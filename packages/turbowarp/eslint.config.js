const babelParser = require('@babel/eslint-parser');
const globals = require('globals');

module.exports = [
    {
        ignores: [
            'node_modules/',
            'build/',
            'dist/',
            'translations/',
            'src/examples/',
            'test/',
            'src/addons/addons/',
            'src/addons/libraries/',
            'src/addons/api-libraries/',
            'src/addons/generated/',
            '**/*.min.js'
        ]
    },
    {
        files: ['**/*.js', '**/*.jsx'],
        languageOptions: {
            parser: babelParser,
            parserOptions: {
                requireConfigFile: false,
                babelOptions: {
                    presets: ['@babel/preset-react']
                }
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
                ...globals.node,
                ...globals.jest
            }
        },
        plugins: {
            import: require('eslint-plugin-import'),
            react: require('eslint-plugin-react'),
            'react-hooks': require('eslint-plugin-react-hooks')
        },
        rules: {
            'no-unused-vars': ['warn', {caughtErrors: 'none'}],
            'no-undef': 'error',
            'import/no-unresolved': 'off',
            'react/jsx-uses-vars': 'error',
            'react/jsx-uses-react': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn'
        },
        settings: {
            react: {
                version: 'detect'
            }
        }
    }
];
