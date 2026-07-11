# Architecture

## Overview
基于 TurboWarp (scratch-gui fork) 的 Mindustry Mod 在线编辑器。
项目目标：零代码门槛的全在线 Mindustry Mod 开发平台。

## Stack
- **Frontend**: React 16 + TurboWarp (scratch-gui) + Webpack 4
- **Backend**: NestJS + BullMQ + PostgreSQL + MinIO (未在本工作区内)
- **Build**: npm (turbowarp), bun (backend)
- **Package Manager**: npm (turbowarp), bun (root workspace)

## Entry Points
- Mindustry 编辑器入口: `packages/turbowarp/src/playground/mindustry.jsx`
- 编辑器根组件(状态持有者): `packages/turbowarp/src/playground/render-interface.jsx`
- Webpack dev server: `npm start` (默认端口 8601)

## Key Source Files
- 编辑器组件: `src/components/mindustry-json-editor/mindustry-json-editor.jsx`
- Schema 解析: `src/lib/mindustry/resolve-schema.js`
- 原版内容数据: `src/lib/mindustry/vanilla-content.js`
- 复合类型: `src/lib/mindustry/compound-types.js`
- 内容类型工具: `src/lib/mindustry/content-type-utils.js`
- Mod 导出: `src/lib/mindustry/mod-export.js`
- GUI 组件(菜单栏): `src/components/gui/gui.jsx`
- 菜单栏: `src/components/menu-bar/menu-bar.jsx`
- 资产卡片(新建菜单): `src/components/mindustry-asset-cards/mindustry-asset-cards.jsx`

## Schema 目录
- 完整 Schema: `src/lib/mindustry/schemas/` (~220 JSON)
- 精选 Schema: `src/lib/mindustry/schemas/curated/` (~85 JSON)
- 精选子类型($ref): `src/lib/mindustry/schemas/curated/types/`
- 中文翻译: `src/lib/mindustry/schemas/zh_CN/` (~120 JSON)

## Mindustry 源码参考
- 核心源码: `~/MindustryWorkspace/Mindustry/core/src/mindustry/`
- 方块基类: `world/Block.java`
- 方块实现: `world/blocks/` (含 distribution/production/power/defense/turrets 等子目录)
- 单位类型: `type/UnitType.java`
- 物品: `world/Item.java`
- 液体: `type/Liquid.java`
- 中文翻译包: `~/MindustryWorkspace/Mindustry/core/assets/bundles/bundle_zh_CN.properties`
- 内容注册: `content/Blocks.java`, `content/Items.java`, `content/UnitTypes.java` 等
- 颜色算法(RNG): `Arc/arc-core/src/arc/math/Rand.java`, `Mindustry/core/src/mindustry/game/Team.java`

## Key Environment Vars
- `PORT` - dev server port
- `NODE_ENV=production` - production build
- `STATIC_PATH` - static asset path
- `ROOT` - URL root path
- `SOURCEMAP` - source map type

## Dev Commands
| Command | Description |
|---|---|
| `npm start` | Start dev server |
| `npm run build` | Clean + webpack production build |
| `npm run watch` | Watch mode |
| `npm run test:lint` | ESLint check |
| Root: `npm run turbowarp:dev` | Start turbowarp dev server |
| Root: `npm run turbowarp:build` | Build turbowarp |

## Build Artifacts
- `build/` - webpack output (HTML + assets + JS)
- `dist/` - library distribution
- Both are tracked in git; ignored for code review

## Directory
```
packages/turbowarp/src/
  components/mindustry-json-editor/  -- 编辑器 UI 组件
  lib/mindustry/                     -- 核心逻辑
    resolve-schema.js                -- Schema 解析系统
    vanilla-content.js               -- 原版游戏内容数据
    compound-types.js                -- 复合类型展开
    content-type-utils.js            -- 内容类型工具函数
    mod-export.js                    -- Mod 导出逻辑
    schemas/                         -- JSON Schema 定义
      Block.json ...                 -- 完整 Schema (~220 文件)
      curated/                       -- 精选 Schema (~100 文件)
        types/                       -- 子类型引用 ($ref)
      zh_CN/                         -- 中文翻译 (~120 文件)
```
