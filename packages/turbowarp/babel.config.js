module.exports = {
    presets: [
        ['@babel/preset-env', {targets: '> 0.25%, not dead'}],
        '@babel/preset-react'
    ],
    plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-async-to-generator'
    ]
};
