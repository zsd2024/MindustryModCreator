# Conventions & Rules

## Schema 修改原则
- **禁止**在 JS 源码中做字符串匹配推断内容类型（如 NAME_TO_TYPE）
- 所有字段类型修正必须直接修改 Schema JSON 的 `type` 字段
- Schema fix 脚本需递归处理：fields、items.fields、oneOf、allOf、以及类型鉴别 key（abilityTypes/bulletTypes/weaponTypes/drawTypes）

## 字段命名约定
- 以 `Effect` 结尾的 string 字段 → type 改为 `Effect`
- 以 `Sound` 结尾的 string 字段 → type 改为 `Sound`
- 名称匹配已知内容类型的（item/bullet/liquid/status/unit 等）→ type 改为对应类型

## 代码风格
- React 16, class components, PropTypes
- no static type checking (TypeScript 仅用于后端)
- ESLint config: `eslint-config-scratch`
- Webpack 4, Babel for JSX transform
- CSS Modules (styles object with css-loader)

## 编辑器状态
- React local state (this.state) 管理展开/折叠、下拉搜索
- Redux 未用于编辑器内部
- `this._onChangeMap` 保存字段 onChange 回调（lazy init）

## 构建注意事项
- `npm run build` 很慢（webpack 4 大量模块）
- 构建产物 build/dist 跟踪在 git 中
- 修改 `*.json` schema 文件不需要重新构建（`require.context` 静态打包）
- 修改 `*.jsx`/`*.js` 需要重新构建

## Schema 类型鉴别结构
部分 curated schema 使用特殊顶级 key 而非 `fields` 数组定义子类型：
- `Ability.json`: `abilityTypes`
- `Bullet.json`: `bulletTypes`
- `Draw.json`: `drawTypes`
- `Weapon.json`: `weaponTypes`

这些子类型的字段修改需要**单独处理**，递归脚本需覆盖这些 key。

## 高级模式
- 状态位于 `render-interface.jsx`（`this.state.advancedMode`）
- 通过 `advancedMode` + `onToggleAdvancedMode` props 向下传递
- json-editor、asset-cards、menu-bar 均通过 props 获取
- 编辑菜单中切换（Turbo Mode 下方）
- `getCuratedTypes()` 从 `require.context` 程序化获取类型列表

## 中文翻译
- zh_CN 文件覆盖部分 Schema 的 localizedName
- `getFieldLabel()` 现在返回 `null` 而非 fieldName（修复标签优先级 bug）
- 主字段标签: `getFieldLabel() || field.name`
- 数组子字段标签: `getFieldLabel() || sf.localizedName || sf.name`
