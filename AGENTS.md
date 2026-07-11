# AGENTS.md — MindustryModCreator

## First steps
1. Read this file and `memory/changelog.md` for context
2. Use `AGENTS.md` as compact reference; consult `memory/*.md` for deep dives
3. After implementing new features or requirements, update `memory/changelog.md` and relevant `memory/*.md`

## Repo architecture
- Monorepo: turbowarp frontend (`packages/turbowarp/`) + NestJS backend
- Mindustry editor entry: `packages/turbowarp/src/playground/mindustry.jsx`
- Core editor component: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`
- React 16, class components, PropTypes, CSS Modules, Webpack 4

## Dev commands (turbowarp)
| Command | Purpose |
|---|---|
| `npm start` | Dev server (port 8601) |
| `npm run build` | Production build (slow!) |
| `npm run test:lint` | ESLint |

## Critical rules
- **NEVER** infer content type via string matching in JS (no NAME_TO_TYPE patterns)
- **ALWAYS** fix field types by editing Schema JSON files directly (`type: "string"` → `type: "Item"`)
- Schema types have **special top-level discriminator keys**: `abilityTypes`, `bulletTypes`, `drawTypes`, `weaponTypes` — these are **NOT** inside `fields[]` and need separate handling
- `getFieldLabel()` returns `null` when no zh_CN match (not field name) — preserves `sf.localizedName` priority in `||` chains
- `forceTeam` renders all 256 teams (0–255 + -1) with exact Mindustry xorshift128+ RNG colors

## Memory persistence
- `memory/changelog.md` — chronological record of changes
- `memory/architecture.md` — project structure and commands
- `memory/schema-system.md` — schema layers and field resolution
- `memory/editor-components.md` — UI component details and rendering flow
- `memory/content-system.md` — VANILLA_CONTENT, REFERENCE_TYPES, mod export
- `memory/special-fields.md` — forceTeam, research, compound types
- `memory/conventions.md` — coding conventions and gotchas

## Memory update policy
Whenever user provides new requirements, implements new features, or clarifies constraints:
1. Update `memory/changelog.md` with what was done
2. Update relevant `memory/*.md` files if facts change
3. Update `AGENTS.md` if new critical rules emerge

## Key files
- `resolve-schema.js` — schema inheritance resolution + label/doc lookup
- `vanilla-content.js` — all vanilla game content (items, blocks, etc.)
- `compound-types.js` — ItemStack/LiquidStack/etc expansion
- `schemas/curated/*.json` — simplified schemas (fix field types here)
- `schemas/curated/types/*.json` — shared sub-schemas ($ref targets)
- `schemas/zh_CN/*.json` — Chinese translations
