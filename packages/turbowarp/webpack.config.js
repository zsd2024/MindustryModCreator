const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const webpack = require('webpack');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const STATIC_PATH = process.env.STATIC_PATH || '/static';
const {APP_NAME} = require('./src/lib/brand');

const root = process.env.ROOT || '';
if (root.length > 0 && !root.endsWith('/')) {
    throw new Error('If ROOT is defined, it must have a trailing slash.');
}

const htmlWebpackPluginCommon = {
    root: root,
    meta: JSON.parse(process.env.EXTRA_META || '{}'),
    APP_NAME
};

const CACHE_EPOCH = 'pentapod';

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: process.env.SOURCEMAP || (process.env.NODE_ENV === 'production' ? false : 'cheap-module-source-map'),
    devServer: {
        static: {
            directory: path.resolve(__dirname, 'build')
        },
        host: '0.0.0.0',
        compress: true,
        port: process.env.PORT || 8601,
        historyApiFallback: {
            rewrites: [
                {from: /^\/\d+\/?$/, to: '/index.html'},
                {from: /^\/\d+\/fullscreen\/?$/, to: '/fullscreen.html'},
                {from: /^\/\d+\/editor\/?$/, to: '/editor.html'},
                {from: /^\/\d+\/embed\/?$/, to: '/embed.html'},
                {from: /^\/addons\/?$/, to: '/addons.html'},
                {from: /^\/$/, to: '/mindustry.html'},
                {from: /^\/mindustry\/?$/, to: '/mindustry.html'},
                {from: /^\/home\/?$/, to: '/mindustry.html'}
            ]
        }
    },
    output: {
        library: 'GUI',
        filename: (
            process.env.NODE_ENV === 'production' ? `js/${CACHE_EPOCH}/[name].[contenthash].js` : 'js/[name].js'
        ),
        chunkFilename: (
            process.env.NODE_ENV === 'production' ? `js/${CACHE_EPOCH}/[name].[contenthash].js` : 'js/[name].js'
        ),
        publicPath: root
    },
    resolve: {
        symlinks: false,
        fallback: {
            buffer: require.resolve('buffer'),
            os: require.resolve('os-browserify'),
            url: require.resolve('url/')
        },
        alias: {
            'text-encoding$': path.resolve(__dirname, 'src/lib/tw-text-encoder'),
            'scratch-render-fonts$': path.resolve(__dirname, 'src/lib/tw-scratch-render-fonts')
        }
    },
    resolveLoader: {
        alias: {
            'worker-loader': require.resolve('worker-loader')
        }
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                include: [
                    path.resolve(__dirname, 'src'),
                    /node_modules[\\/]scratch-[^\\/]+[\\/]src/,
                    /node_modules[\\/]pify/,
                    /node_modules[\\/]@vernier[\\/]godirect/
                ],
                options: {
                    babelrc: false,
                    plugins: [
                        ['react-intl', {
                            messagesDir: './translations/messages/'
                        }]
                    ],
                    presets: ['@babel/preset-env', '@babel/preset-react']
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            modules: {
                                localIdentName: '[name]_[local]_[hash:base64:5]',
                                exportLocalsConvention: 'camelCase'
                            },
                            importLoaders: 1,
                            sourceMap: true
                        }
                    },
                    'postcss-loader'
                ]
            },
            {
                test: /\.sb3$/,
                use: [path.resolve(__dirname, 'webpack/loaders/arraybuffer-loader.js')]
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'node_modules/scratch-blocks/media',
                    to: 'static/blocks-media/default'
                },
                {
                    from: 'node_modules/scratch-blocks/media',
                    to: 'static/blocks-media/high-contrast'
                },
                {
                    from: 'src/lib/themes/blocks/high-contrast-media/blocks-media',
                    to: 'static/blocks-media/high-contrast',
                    force: true
                }
            ]
        })
    ]
};

if (!process.env.CI) {
    base.plugins.push(new webpack.ProgressPlugin());
}

module.exports = [
    defaultsDeep({}, base, {
        entry: {
            'editor': './src/playground/editor.jsx',
            'player': './src/playground/player.jsx',
            'fullscreen': './src/playground/fullscreen.jsx',
            'embed': './src/playground/embed.jsx',
            'addon-settings': './src/playground/addon-settings.jsx',
            'credits': './src/playground/credits/credits.jsx',
            'mindustry': './src/playground/mindustry.jsx'
        },
        output: {
            path: path.resolve(__dirname, 'build')
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: /\.(svg|png|wav|mp3|gif|jpg|woff2|hex)$/,
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 2048
                        }
                    },
                    generator: {
                        filename: 'static/assets/[name].[contenthash:8][ext]'
                    }
                }
            ])
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                minChunks: 2,
                minSize: 50000,
                maxInitialRequests: 5
            }
        },
        plugins: base.plugins.concat([
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`,
                'process.env.DEBUG': Boolean(process.env.DEBUG),
                'process.env.ENABLE_SERVICE_WORKER': JSON.stringify(process.env.ENABLE_SERVICE_WORKER || ''),
                'process.env.ROOT': JSON.stringify(root),
                'process.env.ROUTING_STYLE': JSON.stringify(process.env.ROUTING_STYLE || 'filehash'),
                'process.env.ENABLE_WINDCHIMES': JSON.stringify(process.env.ENABLE_WINDCHIMES || '')
            }),
            new HtmlWebpackPlugin({
                chunks: ['editor'],
                template: 'src/playground/index.ejs',
                filename: 'editor.html',
                title: `${APP_NAME} - Run Scratch projects faster`,
                isEditor: true,
                ...htmlWebpackPluginCommon
            }),
            new HtmlWebpackPlugin({
                chunks: ['mindustry'],
                template: 'src/playground/index.ejs',
                filename: 'index.html',
                title: 'Mindustry Mod Creator - \u5728\u7EBF\u56FE\u5F62\u5316 Mod \u7F16\u8F91\u5668',
                ...htmlWebpackPluginCommon
            }),
            new HtmlWebpackPlugin({
                chunks: ['player'],
                template: 'src/playground/index.ejs',
                filename: 'player.html',
                title: `${APP_NAME} - Run Scratch projects faster`,
                ...htmlWebpackPluginCommon
            }),
            new HtmlWebpackPlugin({
                chunks: ['fullscreen'],
                template: 'src/playground/index.ejs',
                filename: 'fullscreen.html',
                title: `${APP_NAME} - Run Scratch projects faster`,
                ...htmlWebpackPluginCommon
            }),
            new HtmlWebpackPlugin({
                chunks: ['embed'],
                template: 'src/playground/embed.ejs',
                filename: 'embed.html',
                title: `Embedded Project - ${APP_NAME}`,
                ...htmlWebpackPluginCommon
            }),
            new HtmlWebpackPlugin({
                chunks: ['addon-settings'],
                template: 'src/playground/simple.ejs',
                filename: 'addons.html',
                title: `Addon Settings - ${APP_NAME}`,
                ...htmlWebpackPluginCommon
            }),
            new HtmlWebpackPlugin({
                chunks: ['credits'],
                template: 'src/playground/simple.ejs',
                filename: 'credits.html',
                title: `${APP_NAME} Credits`,
                ...htmlWebpackPluginCommon
            }),
            new HtmlWebpackPlugin({
                chunks: ['mindustry'],
                template: 'src/playground/index.ejs',
                filename: 'mindustry.html',
                title: 'Mindustry Mod Creator - \u5728\u7EBF\u56FE\u5F62\u5316 Mod \u7F16\u8F91\u5668',
                ...htmlWebpackPluginCommon
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'static',
                        to: ''
                    }
                ]
            }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'extensions/**',
                        to: 'static',
                        context: 'src/examples'
                    }
                ]
            })
        ])
    })
].concat(
    process.env.NODE_ENV === 'production' || process.env.BUILD_MODE === 'dist' ? (
        defaultsDeep({}, base, {
            target: 'web',
            entry: {
                'scratch-gui': './src/index.js'
            },
            output: {
                libraryTarget: 'umd',
                filename: 'js/[name].js',
                chunkFilename: 'js/[name].js',
                path: path.resolve('dist'),
                publicPath: `${STATIC_PATH}/`
            },
            externals: {
                'react': 'react',
                'react-dom': 'react-dom'
            },
            module: {
                rules: base.module.rules.concat([
                    {
                        test: /\.(svg|png|wav|mp3|gif|jpg|woff2|hex)$/,
                        type: 'asset',
                        parser: {
                            dataUrlCondition: {
                                maxSize: 2048
                            }
                        },
                        generator: {
                            filename: 'static/assets/[name].[contenthash:8][ext]',
                            publicPath: `${STATIC_PATH}/assets/`
                        }
                    }
                ])
            },
            plugins: base.plugins.concat([
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: 'extension-worker.{js,js.map}',
                            context: 'node_modules/scratch-vm/dist/web',
                            noErrorOnMissing: true
                        }
                    ]
                }),
                new CopyWebpackPlugin({
                    patterns: [
                        {
                            from: 'src/lib/libraries/*.json',
                            to: 'libraries/[name][ext]'
                        }
                    ]
                })
            ])
        })) : []
);
