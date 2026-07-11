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
- Webpack dev server: `npm start` (默认端口 8601)

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
