# TurboWarp Maintenance Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deprecated/unused/unmaintained packages in `packages/turbowarp` with maintained equivalents while keeping React on 19.2.7, then verify the editor still runs.

**Architecture:** Pure dependency + small API-migration work. No new features. Three runtime libraries get real code edits (`query-string` v9 needs namespace imports; `react-tooltip` v6 needs component + anchor-prop migration across 3 files); the rest are dependency removals reconciled through `pnpm`. Verification is lint + the existing 292 jest unit tests + a production build + an `/editor` runtime smoke check.

**Tech Stack:** pnpm (turbowarp uses `pnpm-lock.yaml`, `.npmrc` with `shamefully-hoist=true`, `auto-install-peers=false`), Webpack 5, React 19.2.7, react-intl 7, jest 29.

**Spec:** `docs/superpowers/specs/2026-08-28-turbowarp-maintenance-cleanup-design.md`

## Global Constraints

- React / React-DOM stay on **19.2.7** (current latest line) — do NOT bump.
- `react-intl@7` + `@formatjs/intl@3.0.0` + `intl-messageformat@10.7.7` stay pinned — do NOT bump (v10 needs an `injectIntl` rewrite, out of scope).
- `scratch-*` GitHub branch dependencies stay frozen.
- `file-loader` / `url-loader` / `raw-loader` / `base64-loader` stay (still maintained; heavily used via inline `!loader!` syntax).
- Package manager for turbowarp is **pnpm**; after editing `package.json`, run `pnpm install` (do not use npm). If `pnpm install` tries to re-resolve the `scratch-*` git deps and fails offline, fall back to manually editing `pnpm-lock.yaml` importer specifiers (as done in prior upgrade work) instead of a full re-resolution.
- `webpack.config.js` already has an alias `'text-encoding$': path.resolve(__dirname, 'src/lib/tw-text-encoder')` — this alias REMAINS and is what makes removing the `text-encoding` npm package safe.

---

### Task 1: Remove `text-encoding` (deprecated npm package)

**Files:**
- Modify: `packages/turbowarp/package.json` (dependencies block)
- (No src change required — `src/lib/default-project/index.js` already imports `TextEncoder` from `../tw-text-encoder` at line 8 and the webpack alias redirects any `require('text-encoding')` to that local module.)

**Interfaces:**
- Produces: a `package.json` with no `text-encoding` entry; downstream code unaffected because of the existing alias.

- [ ] **Step 1: Remove the dependency line**

In `packages/turbowarp/package.json`, delete this line from `dependencies`:
```json
    "text-encoding": "0.7.0",
```

- [ ] **Step 2: Reconcile lockfile and install**

Run:
```bash
cd packages/turbowarp && pnpm install
```
Expected: `text-encoding` no longer present in `node_modules/.pnpm/` at top level; install exits 0.

- [ ] **Step 3: Lint + unit**

Run:
```bash
pnpm run test:lint && pnpm run test:unit
```
Expected: lint passes, 292 unit tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/turbowarp/package.json packages/turbowarp/pnpm-lock.yaml
git commit -m "chore(turbowarp): remove deprecated text-encoding package"
```

---

### Task 2: Remove `react-ga` (unused dependency)

**Files:**
- Modify: `packages/turbowarp/package.json` (dependencies block)

**Interfaces:**
- Produces: `package.json` with no `react-ga` entry. Confirmed unused: `rg -rln "react-ga" packages/turbowarp/src` returns nothing.

- [ ] **Step 1: Remove the dependency line**

In `packages/turbowarp/package.json`, delete:
```json
    "react-ga": "2.5.3",
```

- [ ] **Step 2: Reconcile lockfile and install**

Run:
```bash
cd packages/turbowarp && pnpm install
```
Expected: install exits 0, `react-ga` removed from store.

- [ ] **Step 3: Lint + unit**

Run:
```bash
pnpm run test:lint && pnpm run test:unit
```
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add packages/turbowarp/package.json packages/turbowarp/pnpm-lock.yaml
git commit -m "chore(turbowarp): remove unused react-ga package"
```

---

### Task 3: Remove `worker-loader` (unused loader)

**Files:**
- Modify: `packages/turbowarp/webpack.config.js` (lines ~82-86, `resolveLoader.alias` block)
- Modify: `packages/turbowarp/package.json` (devDependencies block)

**Interfaces:**
- Produces: webpack config with no `worker-loader` reference; no `worker-loader` in devDeps. Confirmed unused in src: `rg -rn "worker-loader|new Worker\(" packages/turbowarp/src` returns nothing.

- [ ] **Step 1: Confirm no `worker-loader` usage remains**

Run:
```bash
cd packages/turbowarp && rg -rn "worker-loader" src webpack.config.js
```
Expected: only the `resolveLoader.alias` line in `webpack.config.js` (no `src` matches).

- [ ] **Step 2: Remove the `resolveLoader` alias block**

In `webpack.config.js`, delete lines 82-86:
```js
    resolveLoader: {
        alias: {
            'worker-loader': require.resolve('worker-loader')
        }
    },
```
(If after removal `resolveLoader` is referenced nowhere else, delete the whole key; otherwise leave an empty `resolveLoader: {}` only if another loader alias exists. Currently nothing else uses it, so delete the key entirely.)

- [ ] **Step 3: Remove the devDependency**

In `packages/turbowarp/package.json`, delete:
```json
    "worker-loader": "^2.0.0",
```

- [ ] **Step 4: Reconcile lockfile and install**

Run:
```bash
cd packages/turbowarp && pnpm install
```
Expected: install exits 0.

- [ ] **Step 5: Lint (webpack config is linted too) + unit**

Run:
```bash
pnpm run test:lint && pnpm run test:unit
```
Expected: pass. (A full `pnpm run build` is run in Task 5's final verification.)

- [ ] **Step 6: Commit**

```bash
git add packages/turbowarp/webpack.config.js packages/turbowarp/package.json packages/turbowarp/pnpm-lock.yaml
git commit -m "chore(turbowarp): remove unused worker-loader"
```

---

### Task 4: Upgrade `query-string` 5 → 9 and drop `decode-uri-component`

**Files:**
- Modify: `packages/turbowarp/package.json` (dependencies: bump `query-string`, delete `decode-uri-component`)
- Modify: `packages/turbowarp/webpack.config.js` (remove `decode-uri-component$` alias, line 79)
- Modify: `packages/turbowarp/src/lib/detect-locale.js:6` (import style)
- Modify: `packages/turbowarp/src/lib/query-parser-hoc.jsx:3` (import style)
- Modify: `packages/turbowarp/src/lib/save-project-to-server.js:1` (import style)

**Interfaces:**
- Consumes: `queryString.parse(string)` / `queryString.stringify(object)` — these are the ONLY usages (verified in the 3 files). v9 keeps both with the same plain-object behavior.
- Produces: namespace import `import * as queryString from 'query-string'` so `.parse`/`.stringify` resolve regardless of v9's ESM default-export shape.

- [ ] **Step 1: Bump `query-string`, remove `decode-uri-component` in package.json**

In `packages/turbowarp/package.json`:
```json
    "query-string": "^9.4.1",
```
and delete:
```json
    "decode-uri-component": "0.2.0",
```

- [ ] **Step 2: Remove the `decode-uri-component$` webpack alias**

In `webpack.config.js`, delete line 79 (and its preceding comment line 78):
```js
            // query-string@5 requires CJS decode-uri-component; 0.5+ is ESM-only
            'decode-uri-component$': path.resolve(__dirname, 'node_modules/.pnpm/decode-uri-component@0.2.0/node_modules/decode-uri-component')
```

- [ ] **Step 3: Switch the three import sites to namespace imports**

`src/lib/detect-locale.js:6`:
```js
import * as queryString from 'query-string';
```
`src/lib/query-parser-hoc.jsx:3`:
```js
import * as queryString from 'query-string';
```
`src/lib/save-project-to-server.js:1`:
```js
import * as queryString from 'query-string';
```
(The call sites `queryString.parse(location.search)` and `queryString.stringify(queryParams)` need NO other change — v9 returns a plain object for `parse` and accepts a plain object for `stringify`.)

- [ ] **Step 4: Reconcile lockfile and install**

Run:
```bash
cd packages/turbowarp && pnpm install
```
Expected: `query-string@9.x` in store, `decode-uri-component@0.2.0` removed.

- [ ] **Step 5: Lint + unit**

Run:
```bash
pnpm run test:lint && pnpm run test:unit
```
Expected: pass.

- [ ] **Step 6: Runtime smoke — locale detection still works**

Start dev server (`pnpm start`), open `http://localhost:8601/editor?lang=es` and confirm no console error referencing `query-string` / `queryString.parse`. (At minimum, the page must load without a crash overlay.)

- [ ] **Step 7: Commit**

```bash
git add packages/turbowarp/package.json packages/turbowarp/pnpm-lock.yaml packages/turbowarp/webpack.config.js packages/turbowarp/src/lib/detect-locale.js packages/turbowarp/src/lib/query-parser-hoc.jsx packages/turbowarp/src/lib/save-project-to-server.js
git commit -m "chore(turbowarp): upgrade query-string to v9, drop decode-uri-component"
```

---

### Task 5: Upgrade `react-tooltip` 4 → 6 and migrate the 3 call sites

**Files:**
- Modify: `packages/turbowarp/package.json` (dependencies: `react-tooltip` → `^6.0.8`)
- Modify: `packages/turbowarp/src/components/tw-project-input/project-input.jsx` (import + JSX + handlers)
- Modify: `packages/turbowarp/src/components/action-menu/action-menu.jsx` (import + JSX + `ReactTooltip.hide()` removals)
- Modify: `packages/turbowarp/src/components/coming-soon/coming-soon.jsx` (import + JSX + `getContent`/`afterShow`/`afterHide` migration)

**Interfaces:**
- Consumes: react-tooltip v6 API — MUST be confirmed from the installed package's TypeScript definitions before editing (see Step 2). Key facts known: v6 is ESM, named export `Tooltip` (no default `ReactTooltip`), removes `effect` prop, uses `data-tooltip-id` + `data-tooltip-content`/`data-tooltip-html` on anchors, and removes the static `ReactTooltip.show`/`ReactTooltip.hide` methods.
- Produces: three components rendering `<Tooltip>` (v6) instead of `<ReactTooltip>` (v4); tooltips still appear on hover/focus.

- [ ] **Step 1: Bump the dependency**

In `packages/turbowarp/package.json`:
```json
    "react-tooltip": "^6.0.8",
```

- [ ] **Step 2: Install and confirm the exact v6 prop names**

Run:
```bash
cd packages/turbowarp && pnpm install
```
Then read the type definitions to confirm prop names (do NOT guess):
```bash
cat node_modules/.pnpm/react-tooltip@*/node_modules/react-tooltip/dist/react-tooltip.d.ts | rg -n "onShow|onHide|afterShow|afterHide|getContent|content\??:|place\??:|effect\??:|export" | head -40
```
Confirm which of these exist: `id`, `className`, `place`, `content` (replaces `getContent`), `onShow`/`onHide` (replace `afterShow`/`afterHide`). Note: if `onShow`/`onHide` do not exist, the v6 equivalent is the `events` prop plus listening — in that case keep the `isShowing` CSS toggle only if a callback exists; otherwise drop the `setShow`/`setHide` class toggling (tooltip still displays). Record the confirmed names before editing.

- [ ] **Step 3: Migrate `tw-project-input/project-input.jsx`**

Replace the import (line 5):
```js
import {Tooltip} from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
```
Remove `tooltipRef` from the `bindAll` list (line 29) and delete the `tooltipRef` method (lines 83-85).
In `handleBlur` (line 72) delete `ReactTooltip.hide(this.tooltip);`.
In `handleFocus` (line 78) delete `ReactTooltip.show(this.tooltip);`.
In `render`, change the wrapping `<div>` to carry the v6 anchor attributes and render `<Tooltip>`:
```jsx
            <div
                ref={this.tooltipRef}
                data-tooltip-id="project-input-tip"
                data-tooltip-content={this.props.intl.formatMessage(messages.tooltip)}
            >
                <Tooltip
                    id="project-input-tip"
                    className={styles.tooltip}
                    place="top"
                />
                <input
                    ref={this.inputRef}
                    spellCheck="false"
                    type="text"
                    value={`${PROJECT_BASE}${projectId}`}
                    className={styles.input}
                    onKeyDown={this.handleKeyDown}
                    onChange={this.handleChange}
                    onBlur={this.handleBlur}
                    onFocus={this.handleFocus}
                />
            </div>
```
(v6 shows the tooltip automatically on hover/focus of the anchored element, so the imperative show/hide calls are no longer needed.)

- [ ] **Step 4: Migrate `action-menu/action-menu.jsx`**

Replace the import (line 5):
```js
import {Tooltip} from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
```
Remove the two `ReactTooltip.hide();` calls (lines 70 and 79).
Change both `<ReactTooltip ... />` JSX blocks to `<Tooltip ... />`:
- main button tooltip (lines 136-141):
```jsx
                <Tooltip
                    className={styles.tooltip}
                    id={this.mainTooltipId}
                    place={tooltipPlace || 'left'}
                />
```
- per-more-button tooltip (lines 175-182):
```jsx
                                    <Tooltip
                                        className={classNames(styles.tooltip, {
                                            [styles.comingSoonTooltip]: isComingSoon
                                        })}
                                        id={tooltipId}
                                        place={tooltipPlace || 'left'}
                                    />
```
Drop `effect="solid"` from both (v6 has no `effect` prop; `styles.tooltip` already styles it). Anchor buttons already use `data-for`/`data-tip`; change those to `data-tooltip-id={this.mainTooltipId}` + `data-tooltip-content={mainTitle}` (main button) and `data-tooltip-id={tooltipId}` + `data-tooltip-content={title}` (more buttons).

- [ ] **Step 5: Migrate `coming-soon/coming-soon.jsx`**

Replace the import (line 6 area, alongside other imports):
```js
import {Tooltip} from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
```
Change the `<ReactTooltip ... />` (lines 72-88) to `<Tooltip ... />`. Use the confirmed prop names from Step 2:
- `getContent={this.getRandomMessage}` → `content={this.getRandomMessage}` (v6 `content` accepts a React node/function; if v6 only accepts a static node, compute once: `content={this.getRandomMessage()}` — verify against d.ts).
- `afterShow={this.setShow}` / `afterHide={this.setHide}` → `onShow={this.setShow}` / `onHide={this.setHide}` if those props exist per Step 2; otherwise drop them (tooltip still renders, only the `isShowing` CSS animation class is skipped).
- `effect="solid"` removed; `className`/`id`/`place` kept.
Result shape:
```jsx
            <Tooltip
                className={classNames(
                    styles.comingSoon,
                    this.props.className,
                    {
                        [styles.show]: (this.state.isShowing),
                        [styles.left]: (this.props.place === 'left'),
                        [styles.right]: (this.props.place === 'right'),
                        [styles.top]: (this.props.place === 'top'),
                        [styles.bottom]: (this.props.place === 'bottom')
                    }
                )}
                content={this.getRandomMessage}
                id={this.props.tooltipId}
                place={this.props.place}
                onShow={this.setShow}
                onHide={this.setHide}
            />
```
(If `onShow`/`onHide` are absent in v6, delete those two lines and keep `content`.)

- [ ] **Step 6: Lint + unit**

Run:
```bash
pnpm run test:lint && pnpm run test:unit
```
Expected: pass, no `react-tooltip` import/prop errors.

- [ ] **Step 7: Full build**

Run:
```bash
pnpm run build
```
Expected: webpack compiles with no errors (pre-existing harmless warnings are acceptable).

- [ ] **Step 8: Runtime smoke — editor + tooltips**

Start dev server (`pnpm start`), open `http://localhost:8601/editor`:
- Editor renders with no crash overlay.
- Hover/focus the project-input box (top bar) → tooltip with "Copy and paste a Scratch project link here!" appears.
- Hover an action-menu button → tooltip with its title appears.
- Open a "coming soon" addon button (if present) → tooltip with a random cat message appears.
Confirm no console errors mentioning `react-tooltip`, `Tooltip`, `ReactTooltip`, or `effect`.

- [ ] **Step 9: Commit**

```bash
git add packages/turbowarp/package.json packages/turbowarp/pnpm-lock.yaml packages/turbowarp/src/components/tw-project-input/project-input.jsx packages/turbowarp/src/components/action-menu/action-menu.jsx packages/turbowarp/src/components/coming-soon/coming-soon.jsx
git commit -m "chore(turbowarp): upgrade react-tooltip to v6 and migrate call sites"
```

---

## Final Verification (after all tasks)

1. `cd packages/turbowarp && pnpm run test:lint` — clean.
2. `pnpm run test:unit` — 292 pass.
3. `pnpm run build` — compiles.
4. `pnpm start` → `http://localhost:8601/editor` loads, tooltips work, locale `?lang=` detection works.

## Out of Scope (deferred tech-debt, NOT done here)

- `react-contextmenu` (5 files), `react-popover` (1 file) — no maintained React-19 drop-in without a rewrite.
- Webpack-5 asset-module migration of the inline `!url-loader!` / `!raw-loader!` / `!base64-loader!` usages.
- `react-intl` v10 migration.
