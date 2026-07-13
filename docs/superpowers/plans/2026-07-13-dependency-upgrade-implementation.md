# Dependency Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade all non-frozen dependencies to latest across root, backend, and turbowarp.

**Architecture:** Five batches executed sequentially. Each batch is independently testable (lint + build), and no batch proceeds until the previous passes CI.

**Tech Stack:** npm (turbowarp), pnpm (turbowarp after migration), bun (root/backend), Webpack 5, React 19, NestJS 11, Testing Library

## Global Constraints

- Frozen packages (NOT upgraded): `react-contextmenu`, `react-ga`, `scratch-*` GitHub deps, `material-symbols`, `text-encoding`, `redux-mock-store`, `web-audio-test-api`
- After Batch 3 (test migration), `enzyme`, `enzyme-adapter-react-16`, `react-test-renderer` are removed.
- After Batch 2 (toolchain), `url-loader`, `file-loader`, `raw-loader`, `uglifyjs-webpack-plugin`, `babel-eslint` are removed.
- Each batch must pass `npm run test:lint` and `npm run build` (turbowarp) or `npm run lint && npm run build` (backend) before proceeding.

---
### Task 1: Batch 1 — Root + Backend

**Files:**
- Modify: `package.json` (root)
- Modify: `packages/backend/package.json`
- Modify: `packages/backend/.eslintrc.js` → migrate to flat config if needed
- Modify: `.husky/` directory structure for Husky v9

**Interfaces:**
- Consumes: existing package.json files
- Produces: upgraded package.json with root + backend deps on latest

- [ ] **Step 1: Upgrade root devDependencies**

```bash
# Upgrade root devDeps: typescript, prettier, eslint, @typescript-eslint/*, husky, lint-staged
npm install typescript@latest prettier@latest eslint@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest husky@latest lint-staged@latest --save-dev
```

- [ ] **Step 2: Upgrade backend dependencies**

```bash
cd packages/backend
npm install @nestjs/common@latest @nestjs/core@latest @nestjs/platform-express@latest @nestjs/swagger@latest @nestjs/config@latest @nestjs/bullmq@latest @nestjs/typeorm@latest @nestjs/schedule@latest bullmq@latest ioredis@latest typeorm@latest pg@latest minio@latest dockerode@latest hjson@latest class-transformer@latest class-validator@latest reflect-metadata@latest rxjs@latest uuid@latest --save
npm install @nestjs/cli@latest @nestjs/schematics@latest @nestjs/testing@latest @types/express@latest @types/jest@latest @types/node@latest @types/dockerode@latest @types/uuid@latest typescript@latest jest@latest ts-jest@latest ts-node@latest eslint@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest prettier@latest supertest@latest @types/supertest@latest --save-dev
```

- [ ] **Step 3: Migrate ESLint to flat config (root + backend)**

ESLint 9 requires flat config. Read existing rules from `.eslintrc.js` and `packages/backend/.eslintrc.js`, then convert to `eslint.config.js`:

```js
// eslint.config.js (root)
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['packages/backend/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: { 
        project: 'packages/backend/tsconfig.json',
        tsconfigRootDir: __dirname
      }
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      // Copy rules from packages/backend/.eslintrc.js
    }
  },
  { ignores: ['**/node_modules/**', '**/dist/**'] }
];
```

Delete old `.eslintrc.js` files after migration.

- [ ] **Step 4: Migrate Husky v8 → v9**

Husky v9 changes how hooks are configured:

```bash
npx husky init
# Moves hooks from .husky/ to .husky/_/ and changes config format
```

Update `.husky/pre-commit`:
```bash
npx lint-staged
```

- [ ] **Step 5: Run backend lint + build to verify**

```bash
cd packages/backend
npm run lint
npm run build
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: upgrade root + backend deps to latest (NestJS 11, ESLint 9, Husky 9)"
```

---

### Task 2: Batch 2 — Turbowarp Toolchain (Webpack 4→5, loaders, babel, postcss)

**Files:**
- Modify: `packages/turbowarp/package.json`
- Modify: `packages/turbowarp/webpack.config.js` (major rewrite for Webpack 5)
- Modify: `packages/turbowarp/.eslintrc.js` (→ flat config if needed)
- Modify: `packages/turbowarp/babel.config.js` (if exists)
- Remove: `packages/turbowarp/.babelrc` (if exists, merge into babel.config.js)

**Interfaces:**
- Consumes: existing webpack config and package.json
- Produces: Webpack 5 config, upgraded loaders, removed deprecated loaders

- [ ] **Step 1: Upgrade webpack and core loaders in package.json**

```bash
cd packages/turbowarp
npm install webpack@latest webpack-cli@latest webpack-dev-server@latest --save-dev
npm install css-loader@latest style-loader@latest postcss-loader@latest postcss-import@latest postcss-simple-vars@latest autoprefixer@latest --save
npm install babel-loader@latest @babel/core@latest @babel/cli@latest @babel/preset-env@latest @babel/preset-react@latest @babel/plugin-proposal-object-rest-spread@latest @babel/plugin-syntax-dynamic-import@latest @babel/plugin-transform-async-to-generator@latest --save-dev
npm install html-webpack-plugin@latest copy-webpack-plugin@latest --save-dev
npm install eslint@latest eslint-config-scratch@latest eslint-plugin-import@latest eslint-plugin-react@latest eslint-plugin-jest@latest @babel/eslint-parser@latest --save-dev
```

- [ ] **Step 2: Remove deprecated loaders**

```bash
cd packages/turbowarp
npm uninstall url-loader file-loader raw-loader uglifyjs-webpack-plugin arraybuffer-loader base64-loader
```

- [ ] **Step 3: Rewrite webpack.config.js for Webpack 5**

Key changes from Webpack 4 → 5. Reference the existing `webpack.config.js` for loader rules and plugin config:

```js
// webpack.config.js (Webpack 5)

module.exports = {
  // ... most resolve, entry, output, devServer config stays the same

  module: {
    rules: [
      // Asset modules replace url-loader/file-loader/raw-loader (removed from deps)
      {
        test: /\.(svg|png|wav|mp3|gif|jpg|woff2|hex)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 2048 // same as url-loader limit
          }
        },
        generator: {
          filename: 'static/assets/[name].[contenthash:8][ext]'
        }
      },
      // CSS with postcss — css-loader v7 modules option changed
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]_[local]_[hash:base64:5]'
              },
              importLoaders: 1,
              sourceMap: true
            }
          },
          'postcss-loader'
        ]
      }
    ]
  },
  // Webpack 5 has built-in TerserPlugin (uglifyjs-webpack-plugin removed)
  optimization: {
    minimize: true,
    // splitChunks config stays the same
  },
  // Webpack 5 no longer polyfills Node.js modules
  resolve: {
    fallback: {
      // Check build errors first, then add polyfills for missing modules
      // e.g., "crypto": require.resolve("crypto-browserify")
    }
  }
};
```

- [ ] **Step 4: Update postcss.config.js if separate**

PostCSS 8+ uses a different config format:

```js
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-simple-vars'),
    require('autoprefixer')
  ]
};
```

- [ ] **Step 5: Migrate ESLint to flat config**

ESLint 9 with `@babel/eslint-parser` for JSX:

```js
// eslint.config.js (turbowarp)
const babelParser = require('@babel/eslint-parser');

module.exports = [
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react']
        }
      }
    },
    rules: { /* copy from existing .eslintrc.js */ }
  }
];
```

- [ ] **Step 6: Update babel config**

```js
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: '> 0.25%, not dead' }],
    '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-async-to-generator'
  ]
};
```

- [ ] **Step 7: Run lint + build**

```bash
cd packages/turbowarp
npm run test:lint
npm run build
```

Expected: No errors. Fix any Webpack 5 migration issues (asset modules path changes, resolve fallback, etc.).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: upgrade turbowarp toolchain to latest (Webpack 5, css-loader 7, postcss 8, ESLint 9)"
```

---

### Task 3: Batch 3 — Test Migration (Enzyme → React Testing Library)

**Files:**
- Modify: `packages/turbowarp/test/helpers/enzyme-setup.js` → remove
- Create: `packages/turbowarp/test/helpers/setup.js` (RTL setup)
- Modify: all `*.test.js` / `*.test.jsx` files using Enzyme (`shallow`, `mount`, `render`)
- Modify: `packages/turbowarp/package.json`

**Interfaces:**
- Consumes: existing enzyme tests
- Produces: all tests using `@testing-library/react`

- [ ] **Step 1: Install RTL packages, remove enzyme**

```bash
cd packages/turbowarp
npm install @testing-library/react@latest @testing-library/jest-dom@latest @testing-library/user-event@latest --save-dev
npm uninstall enzyme enzyme-adapter-react-16 react-test-renderer
```

- [ ] **Step 2: Create RTL setup file**

```js
// test/helpers/setup.js
import '@testing-library/jest-dom';
```

Update `jest.setupFiles` in `package.json` to point to `setup.js` instead of `enzyme-setup.js`.

- [ ] **Step 3: Find and identify all Enzyme tests**

```bash
grep -rn 'shallow\|mount\|enzyme' test/ --include='*.js' --include='*.jsx'
```

- [ ] **Step 4: Rewrite each Enzyme test to RTL**

Enzyme → RTL patterns:

| Enzyme | RTL |
|--------|-----|
| `shallow(<Component />)` | `render(<Component />)` |
| `mount(<Component />)` | `render(<Component />)` |
| `wrapper.find('.class')` | `screen.getByText()`, `screen.getByRole()` |
| `wrapper.find(Selector)` | `container.querySelector()` |
| `wrapper.setProps({x: 1})` | `rerender(<Component x={1} />)` |
| `wrapper.simulate('click')` | `fireEvent.click(screen.getByRole('button'))` |
| `wrapper.state()` | Assert on rendered output |
| `wrapper.instance()` | Not needed — test behavior, not internals |

Example migration:

```js
// Before (Enzyme)
import { shallow } from 'enzyme';
const wrapper = shallow(<MyComponent prop="value" />);
expect(wrapper.find('.title').text()).toBe('Hello');

// After (RTL)
import { render, screen } from '@testing-library/react';
render(<MyComponent prop="value" />);
expect(screen.getByText('Hello')).toBeInTheDocument();
```

- [ ] **Step 5: Update jest config to remove enzyme-specific settings**

Remove `setupFiles: ['<rootDir>/test/helpers/enzyme-setup.js']` or update it.

- [ ] **Step 6: Run tests to verify**

```bash
cd packages/turbowarp
npm run test:unit
npm run test:lint
```

Expected: All tests pass with RTL.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: migrate Enzyme tests to React Testing Library"
```

---

### Task 4: Batch 4 — Turbowarp Runtime (React 16→19, Redux, react-intl, etc.)

**Files:**
- Modify: `packages/turbowarp/package.json`
- Modify: `packages/turbowarp/src/**/*.jsx` (React 18/19 API migration)

**Interfaces:**
- Consumes: upgraded Webpack 5 build from Batch 2, RTL from Batch 3
- Produces: React 19 application, all runtime deps on latest

- [ ] **Step 1: Upgrade all runtime packages**

```bash
cd packages/turbowarp
npm install react@latest react-dom@latest react-intl@latest redux@latest react-redux@latest prop-types@latest --save
npm install react-modal@latest react-draggable@latest react-tabs@latest react-tooltip@latest react-virtualized@latest react-responsive@latest react-markdown@latest --save
```

- [ ] **Step 2: Migrate React 16 → 18/19 entry point**

File: `src/playground/app-target.js`

Old:
```jsx
import ReactDOM from 'react-dom';
const render = children => {
    ReactDOM.render(children, appTarget);
};
```

New:
```jsx
import { createRoot } from 'react-dom/client';
const root = createRoot(appTarget);
const render = children => {
    root.render(children);
};
```

- [ ] **Step 3: Find and fix deprecated React lifecycle methods**

React 18+ deprecates: `componentWillMount`, `componentWillReceiveProps`, `componentWillUpdate`

Search for these in `src/`:
```bash
grep -rn 'componentWillMount\|componentWillReceiveProps\|componentWillUpdate\|UNSAFE_' src/ --include='*.jsx' --include='*.js'
```

Rename to `UNSAFE_componentWillMount` etc. for React 18, or migrate to `componentDidMount` / `getDerivedStateFromProps`.

- [ ] **Step 4: Migrate react-intl v2 → v7**

Key breakages:
- `addLocaleData()` removed — remove all calls to it
- `intlShape` removed — replace with `PropTypes.object`
- `defineMessages` still works
- `injectIntl` HOC still works in v7
- `FormattedMessage` API is compatible

Search for imports to fix:
```bash
grep -rn 'addLocaleData\|intlShape' src/ --include='*.jsx' --include='*.js'
```

```jsx
// Before
import { addLocaleData, intlShape } from 'react-intl';
import en from 'react-intl/locale-data/en';
addLocaleData(en);
MyComp.propTypes = { intl: intlShape };

// After
// Remove addLocaleData entirely
MyComp.propTypes = { intl: PropTypes.object };
```

- [ ] **Step 5: Migrate Redux 3 → 5**

```jsx
// Before
import { createStore, combineReducers } from 'redux';

// After (Redux 5)
import { legacy_createStore as createStore, combineReducers } from 'redux';
// Or migrate to configureStore from @reduxjs/toolkit
```

Check for `redux` usage in `src/`:
```bash
grep -rn 'createStore\|combineReducers\|applyMiddleware\|compose' src/ --include='*.jsx' --include='*.js' | grep -v node_modules
```

- [ ] **Step 6: Migrate react-redux 5 → 9**

```jsx
// Before
import { connect } from 'react-redux';

// After (v9)
import { connect } from 'react-redux';
// connect still works in v9, but Provider usage changed
```

Update `Provider`:
```jsx
import { Provider } from 'react-redux';
<Provider store={store}> {/* still works */} </Provider>
```

- [ ] **Step 7: Fix react-modal for React 19**

React 19 has stricter rules about `findDOMNode`. Check if `react-modal` uses it (it likely does by default). May need to set `reactModalSuppressFindDOMNodeWarning` flag or use a newer version.

- [ ] **Step 8: Run lint + build**

```bash
cd packages/turbowarp
npm run test:lint
npm run build
```

Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: upgrade turbowarp runtime deps (React 19, Redux 5, react-intl 7)"
```

---

### Task 5: Batch 5 — Remaining Small Packages

**Files:**
- Modify: `packages/turbowarp/package.json`

- [ ] **Step 1: Upgrade remaining small deps**

```bash
cd packages/turbowarp
npm install classnames@latest bowser@latest cookie@latest core-js@latest lodash.bindall@latest lodash.debounce@latest lodash.defaultsdeep@latest lodash.omit@latest lodash.throttle@latest papaparse@latest hjson@latest js-base64@latest omggif@latest --save
```

- [ ] **Step 2: Upgrade remaining devDeps**

```bash
cd packages/turbowarp
npm install chromedriver@latest selenium-webdriver@latest gh-pages@latest rimraf@latest mkdirp@latest raf@latest jest-junit@latest yauzl@latest --save-dev
```

- [ ] **Step 3: Run lint + build**

```bash
cd packages/turbowarp
npm run test:lint
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: upgrade remaining small turbowarp deps"
```

---
