# TurboWarp 魔改方案

## 概述

本项目基于 [TurboWarp/scratch-gui](https://github.com/TurboWarp/scratch-gui)（`develop` 分支）进行深度魔改，将原本面向 Scratch 儿童编程的积木编辑器，映射为 Mindustry Mod 的图形化开发工具。

通过 `git subtree` 方式集成，便于后续同步上游更新。

## 概念映射

| Scratch/TurboWarp | Mindustry Mod Creator | 说明 |
|:---|:---|:---|
| 角色/精灵区 (TargetPane) | **内容资产区** | 树形文件夹管理，管理 Block/Item/Unit/Liquid 等 Content |
| 代码区 (Blocks) | **智能编辑区** | 双模式：HJSON 可视化表单 / Java 上下文积木，根据 Content 类型自动切换 |
| 舞台 (Stage) | **Mindustry 预览** | 实时渲染当前 Mod 的游戏画面 |
| 造型/声音 (Costume/Sound) | **资产详情区** | 管理 Icon (32x32) 和 Sound 资源 |
| 菜单栏 (MenuBar) | **Mod 工具栏** | 项目元信息配置、保存、编译按钮 |

## 目录结构

```
packages/turbowarp/
├── src/
│   ├── components/
│   │   ├── gui/                    # [魔改] 主布局组件
│   │   ├── target-pane/            # [魔改] → 内容资产区
│   │   ├── sprite-selector/        # [魔改] → 资产树节点
│   │   ├── sprite-selector-item/   # [魔改] → 单个资产项
│   │   ├── blocks/                 # [魔改] → Java 积木区
│   │   ├── stage/                  # 保留 → Mindustry 预览
│   │   ├── stage-wrapper/          # 保留 → 预览容器
│   │   ├── menu-bar/               # [魔改] → Mod 工具栏
│   │   └── asset-detail/           # [新增] 资产详情面板
│   ├── containers/
│   │   ├── gui.jsx                 # [魔改] 主容器
│   │   ├── target-pane.jsx         # [魔改] 资产树容器
│   │   ├── blocks.jsx              # [魔改] 编辑区容器
│   │   └── ...
│   ├── reducers/                   # [扩展] 新增 Mindustry Reducer
│   ├── lib/
│   │   ├── mindustry-schemas/      # [新增] Block/Item JSON Schema 定义
│   │   └── hjson-generator.js      # [新增] HJSON 文件生成器
│   └── tw-mindustry-extensions/    # [新增] Mindustry 专属积木扩展
└── webpack.config.js               # [魔改] 构建配置
```

## 核心魔改点

### 1. 内容资产区（原 Sprite Selector）

**目标**：将 Scratch 中的 Sprite/Stage 概念改为 Mindustry 的 Content 树。

**文件**：`src/components/target-pane/`, `src/components/sprite-selector/`, `src/components/sprite-selector-item/`

**改动**：
- 添加虚拟文件夹层级（`parentId` 树），用户可创建多级目录如 `方块/防御/墙壁`
- 右键菜单：新建文件夹、重命名、删除
- 拖拽排序
- 节点类型图标：📁 文件夹 / 🧱 方块 / 📦 物品 / 🚀 单位 / 💧 液体

**数据结构**（来自 Redux Store）：

```javascript
// 扁平节点 + parentId 树
{
  id: 'uuid',
  type: 'folder' | 'content',
  name: '钛墙',
  parentId: 'folder_防御' | null,
  order: 0,
  contentType: 'block' | 'item' | 'unit' | 'liquid', // 仅 content
  hjsonSchema: { health: 800, size: 1, requirements: [...] },
  javaBlocks: null,
  hasCustomLogic: false,
  editorMode: 'hjson' | 'java',
  iconBase64: '...'
}
```

### 2. 智能编辑区（原 Blocks）

**目标**：根据选中的 Content 自动切换 HJSON 表单 / Java 积木。

**模式 A：HJSON 图形化表单**
- 触发：`hasCustomLogic === false`
- 使用 `react-jsonschema-form` 或自定义表单组件
- UI 控件：滑动条、颜色选择器、网格点选器、数组卡片列表
- 字段按用途分组折叠（基础属性 / 外观特效 / 生产消耗）

**模式 B：Java 上下文积木**
- 触发：`hasCustomLogic === true` 或 Content 需要 Java（如自定义单位 AI）
- 积木面板动态渲染，只显示与当前 Content 类型相关的积木
- 上下文积木：`[当前方块 (this)]`、`[获取当前方块血量]` → 转译为 `this.health`

### 3. 资产详情区（新增组件）

**位置**：原 Costume/Sound Tab 区域。

**功能**：
- Icon 管理：上传/编辑 32x32 PNG，自动编码为 Base64
- Sound 管理：上传音效文件
- 内部名称管理（全局唯一锁定标识符）

### 4. Java 代码转译引擎

**位置**：`src/lib/tw-mindustry-transpiler/`

**功能**：将 Scratch VM 的 Block AST（JSON）转译为有效的 Java 源码，继承自 Mindustry 基类。

```javascript
// 示例转译
Input:  blocks = [{ type: 'when_block_updates' }, { type: 'set_health', value: 500 }]
Output: "public class TitaniumWall extends Wall {
           public TitaniumWall(String name) { super(name); }
           @Override
           public void updateTile() {
             super.updateTile();
             this.health = 500;
           }
         }"
```

### 5. Redux Store 扩展

原有的 Scratch GUI Redux 结构（`state.scratchGui.*`）基础上，新增命名空间：

```
state.mindustryMod = {
  nodes: {},             // 资产树节点
  selectedId: null,      // 当前选中节点
  expandedIds: [],       // 展开的文件夹
  projectMeta: {},       // 项目元数据
  isDirty: false         // 是否需要保存
}
```

## 修改文件清单

### 原有文件（修改）

| 文件路径 | 改动说明 |
|:---|:---|
| `src/components/gui/gui.jsx` | 注入 Mindustry 特有状态、修改 Tab 渲染逻辑 |
| `src/components/gui/gui.css` | 适配四栏布局样式 |
| `src/components/target-pane/target-pane.jsx` | 替换为文件夹树结构 |
| `src/components/sprite-selector/sprite-selector.jsx` | 改为 Content 资产树 |
| `src/components/sprite-selector-item/` | 改为 Content 节点 |
| `src/containers/gui.jsx` | 连接 Mindustry Redux Store |
| `src/containers/blocks.jsx` | 支持 HJSON/Java 双模式 |
| `src/components/menu-bar/menu-bar.jsx` | 添加 Mod 特有按钮 |
| `src/reducers/gui.js` | 注册 mindustryMod reducer |
| `webpack.config.js` | 添加别名、loader 配置 |

### 新增文件

| 文件路径 | 说明 |
|:---|:---|
| `src/reducers/mindustry-mod.js` | Mindustry 资产树 Reducer |
| `src/components/asset-detail/` | 资产详情面板组件 |
| `src/lib/mindustry-schemas/blocks/` | 方块 JSON Schema |
| `src/lib/mindustry-schemas/items/` | 物品 JSON Schema |
| `src/lib/tw-mindustry-transpiler/` | Java 转译引擎 |
| `src/lib/hjson-generator.js` | HJSON 文件生成 |
| `src/lib/mindustry-constants.js` | 常量定义 |
| `src/tw-mindustry-extensions/` | Mindustry 积木扩展 |

## 构建与开发

### 本地开发

```bash
# 安装 turbowarp 依赖
cd packages/turbowarp
npm install

# 启动开发服务器 (webpack-dev-server)
npm start

# 构建
npm run build
```

### 构建产物

- `packages/turbowarp/build/` — 开发构建
- `packages/turbowarp/dist/` — 生产构建

构建产物会通过 GitHub Actions 自动编译并提交回仓库。

### GitHub Actions

参考 `.github/workflows/build-turbowarp.yml`：

1. 手动触发需要编译的 TurboWarp 源
2. Actions 在云端 `npm ci && npm run build`
3. 编译产物自动 commit & push 到当前仓库
4. 开发环境直接使用仓库中的 build/dist 目录

## 同步上游更新

### 拉取 TurboWarp 最新代码

```bash
# 从 TurboWarp develop 分支拉取最新代码
git subtree pull --prefix=packages/turbowarp \
  https://github.com/TurboWarp/scratch-gui.git develop --squash
```

### 推送本地修改到 TurboWarp fork

```bash
git subtree push --prefix=packages/turbowarp \
  https://github.com/your-fork/scratch-gui.git develop
```

## 开发指南

### 概念

修改 TurboWarp 时需注意：

1. **不要直接修改 `package.json`** 中的依赖版本，除非同步上游
2. **概念映射优先**：尽量复用 Scratch 的概念，不要推翻重来
3. **样式隔离**：使用 CSS Modules（Scratch 默认），新组件样式注意命名空间
4. **React 版本**：scratch-gui 使用 React 16，只能写类组件，不支持 Hooks

### 快速定位

| 需求 | 对应文件 |
|:---|:---|
| 布局结构调整 | `src/components/gui/gui.jsx` |
| 左侧面板改造 | `src/components/target-pane/` |
| 编辑区改造 | `src/components/blocks/` |
| 预览区 | `src/components/stage-wrapper/` |
| 顶部菜单 | `src/components/menu-bar/` |
| Redux 状态 | `src/reducers/` |
| 积木扩展 | `scratch-vm` 中的扩展系统 |
