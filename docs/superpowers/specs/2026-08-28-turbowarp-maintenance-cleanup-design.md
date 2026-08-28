# Maintenance Cleanup — Make TurboWarp Dependencies Maintained (Not Latest-For-Latest)

## Goal

Keep React on the current latest line (19.2.7) and replace the genuinely
unmaintained / deprecated / unused packages in `packages/turbowarp` with
maintained equivalents. This is **not** an aggressive every-major upgrade —
packages that are still maintained but old, or that would require a large
rewrite, are left in place and documented as tech-debt.

## Confirmed Current State

- React / React-DOM: **19.2.7** (current latest line) — no change.
- Webpack 5 toolchain, RTL, Redux 5, css-loader 7 — already modern, no change.
- `react-intl@7` + matching `@formatjs/intl@3` + `intl-messageformat@10` —
  kept (v10 needs an `injectIntl` rewrite; out of scope).
- `scratch-*` GitHub branches — kept (TurboWarp core).

## Batch A — Remove dead / unmaintained / unused

| Package | Reason | Action |
|---|---|---|
| `text-encoding` | npm-deprecated ("no longer maintained") | Remove dep; in `src/lib/default-project/index.js` use the global `TextEncoder` / `TextDecoder` (already guarded by `|| TextEncoder` fallback) |
| `react-ga` | No usage anywhere in `src` | Remove dependency entirely |
| `worker-loader` | Unused in `src`; only an alias at `webpack.config.js:84` | Remove the `'worker-loader'` resolve/loader entry and the devDependency |

## Batch B — Upgrade low-risk maintained libraries

| Package | From → To | Risk / Notes |
|---|---|---|
| `query-string` | `^5.1.1` → `^9.4.1` | Only `.parse(location.search)` and `.stringify(obj)` are used (plain-object API, unchanged in v9). Verify 3 files: `src/lib/detect-locale.js`, `src/lib/save-project-to-server.js`, `src/lib/query-parser-hoc.jsx` |
| `decode-uri-component` | pin `0.2.0` → **remove** | v9 of `query-string` no longer depends on it; drop the direct dep AND the `decode-uri-component$` webpack alias added earlier |
| `react-tooltip` | `4.5.0` → `6.0.8` | v6 replaces default `ReactTooltip` tag with named `Tooltip` component and changes `ReactTooltip.show/hide` to refs/props. Rewrite 3 files: `src/components/action-menu/action-menu.jsx`, `src/components/coming-soon/coming-soon.jsx`, `src/components/tw-project-input/project-input.jsx`. Update `.css` comment reference if any |

## Batch C — Deferred tech-debt (kept, documented)

These are old but would require non-trivial rewrites; intentionally NOT upgraded now:

- `react-contextmenu` (2.9.4) — used in 5 files (`ContextMenu`/`MenuItem`/`ContextMenuTrigger`). No maintained React-19-friendly drop-in without a rewrite.
- `react-popover` (0.5.10) — 1 file (`direction-picker.jsx`).
- `file-loader` / `url-loader` / `raw-loader` / `base64-loader` — still maintained (2026 publishes) and used heavily via inline `!loader!` syntax across addons; removing needs a Webpack-5 asset-module migration, out of scope.
- `react-intl@7` + `@formatjs/*@3` + `intl-messageformat@10` — v10 needs `injectIntl` rewrite.
- Tiny old-but-functional utils (`keymirror`, `to-style`, `xhr`, `balance-text`, `computed-style-to-inline-style`, `redux-throttle`, `react-string-replace`, `get-float-time-domain-data`, `get-user-media-promise`) — left as-is; still installable and maintained enough.

## Package Manager Note

`packages/turbowarp` installs with **npm** (root uses bun workspaces but turbowarp is npm).
- Edit `package.json`, then reconcile `package-lock.json` (or `pnpm-lock.yaml` if present) and reinstall.
- Do **not** run a lockfile re-resolution that re-fetches the `scratch-*` GitHub branches unless intended.

## Verification Per Batch

After each batch:
1. `npm run test:lint` — ESLint passes
2. `npm run test:unit` — 292 unit tests pass (jest addons)
3. `npm run build` (or `webpack --bail`) — compiles, no new errors
4. `npm start` + open `http://localhost:8601/editor` — editor renders, no crash overlay

Final smoke after Batch B: confirm editor loads, addons still load, tooltips still appear (action-menu / project-input / coming-soon), query-param locale detection still works.

## Out of Scope

- React major bumps (already latest line)
- Full `react-intl` v10 migration
- `react-contextmenu` / `react-popover` replacement
- Webpack-5 asset-module migration of inline loaders
- Root/backend package bumps (already modern; not requested)
