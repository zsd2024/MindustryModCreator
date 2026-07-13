# Dependency Upgrade Plan

## Scope

Upgrade all upgradable dependencies across the monorepo to latest available versions, excluding archived/npm-deprecated packages and GitHub branch dependencies (`scratch-*`).

## Structure

Four sequential batches, each verified before proceeding to the next.

### Batch 1: Root + Backend

- `@nestjs/*`: ^10.3.0 → latest v11.x
- `@nestjs/swagger`: ^7.2.0 → latest
- `typeorm`: ^0.3.19 → latest v0.3.x patch
- `bullmq`, `ioredis`, `pg`, `minio`, `dockerode`: latest
- Root deps: `typescript`, `eslint` (^8 → ^9, requires flat config migration), `prettier`, `husky` (^8 → ^9), `@typescript-eslint/*`, `lint-staged`

### Batch 2: Turbowarp Toolchain

- `webpack`: 4.47.0 → 5.x (asset modules replace file-loader/url-loader/raw-loader)
- `css-loader`: ^1.0.0 → ^7.x (CSS Modules config rewrite)
- `style-loader`: ^0.23.0 → ^4.x
- `postcss-loader`: ^3.0.0 → ^8.x
- `postcss-import`: ^12.0.0 → latest
- `postcss-simple-vars`: ^5.0.1 → latest
- `babel-loader`: 8.3.0 → 9.x (Webpack 5 plugin format)
- `html-webpack-plugin`: ^4.2.0 → ^5.x
- `copy-webpack-plugin`: 6.4.1 → latest
- **Remove**: `url-loader`, `file-loader`, `raw-loader` (replaced by Webpack 5 asset modules)
- **Remove**: `uglifyjs-webpack-plugin` (use built-in TerserPlugin)
- `babel` packages: ^7.x latest
- `autoprefixer`: ^9.0.1 → latest
- `eslint` (turbowarp): 8.55.0 → 9.x (flat config)
- All eslint plugins: latest compatible
- `jest` (turbowarp): ^29.7.0 → latest v29 patch
- `chromedriver`, `selenium-webdriver`: latest compatible
- `gh-pages`, `rimraf`, `mkdirp`, `raf`: latest

### Batch 3: Turbowarp Runtime

- `react` / `react-dom`: ^16.0.0 → ^19.x (createRoot, lifecycle migration)
- `react-intl`: 2.9.0 → 7.x (API rewrite)
- `redux`: 3.7.2 → 5.x
- `react-redux`: 5.0.7 → 9.x
- `react-modal`: 3.9.1 → latest
- `react-draggable`: 3.0.5 → latest
- `react-tabs`: 2.3.0 → latest
- `react-tooltip`: 3.8.0 → latest
- `react-virtualized`: 9.20.1 → latest
- `react-responsive`: 5.0.0 → latest
- `react-markdown`: ^8.0.7 → latest
- `prop-types`: ^15.5.10 → latest

### Batch 4: Remaining Small Packages

- `classnames`: 2.2.6 → latest
- `bowser`: 1.9.4 → latest
- `cookie`: 0.5.0 → latest
- `core-js`: 2.5.7 → latest
- `lodash.*`: latest
- `papaparse`: 5.3.0 → latest
- `hjson`: ^3.2.2 → latest
- `js-base64`: 2.4.9 → latest
- `omggif`: 1.0.9 → latest
- All other pinned deps with `^` prefix

## Frozen Packages (NOT upgraded)

- `enzyme` / `enzyme-adapter-react-16` (archived)
- `react-contextmenu` (no React 18+ support)
- `react-ga` (replaced by react-ga4, but not in scope)
- `react-test-renderer` (pinned to 16.x for enzyme)
- `scratch-*` GitHub deps (branches)
- `material-symbols` (npm package, unused after react-icons migration)
- `text-encoding` (deprecated polyfill)
- `babel-eslint` (replaced by @babel/eslint-parser in Batch 2)
- `redux-mock-store` (testing, pinned)
- `web-audio-test-api` (testing, pinned)

## Verification Per Batch

After each batch:
1. `npm run test:lint` — ESLint passes
2. Webpack build (`npm run build` or `webpack --colors --bail`) — compiles without errors
3. For backend: `npm run lint` + `npm run build`
