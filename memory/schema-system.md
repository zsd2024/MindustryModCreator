# Schema System

## Three Layers

### 1. Full Schemas (`schemas/*.json`)
- 完整字段列表，含 notes (文档)
- 每个 content type 一个文件 (~220 文件)
- 用于高级模式 (Advanced Mode)

### 2. Curated Schemas (`schemas/curated/*.json`)
- 精选常用字段，简洁
- 用于普通模式
- 支持 `$ref` 引用 `types/*.json` 子类型
- 可含 `parentType` 继承父类字段
- 类型鉴别结构（如 Ability/Bullet/Weapon/Draw）使用 `abilityTypes`/`bulletTypes`/`weaponTypes`/`drawTypes` 顶级 key，**不在** `fields` 数组内

### 3. zh_CN Localization (`schemas/zh_CN/*.json`)
- 字段中文名和中文文档
- `getFieldLabel()` 遍历 parentType 链查找翻译

## Field Resolution (`resolveFields`)

```js
resolveFields(type, mode, visited)
- mode='curated': 优先 curated → fallback full
- mode='full': 仅 full schemas
- 递归遍历 parentType 链
- 父类字段在前，子类字段在后
- 每个字段标记 sourceType
- visited Set 防止循环引用
```

## Loading Mechanism
- Webpack `require.context()` 静态打包 JSON
- 三个 context: `./schemas` (递归 curated), `./schemas/curated` (递归), `./schemas/zh_CN` (平铺)
- `resolveFieldRef()` 处理 `$ref` 引用

## Key Rule: 直接修 Schema
**禁止**在 JS 源码中做字符串匹配来推断字段类型（如 NAME_TO_TYPE 映射）。
所有内容类型修正（item → Item, sound → Sound 等）必须直接修改 Schema JSON 文件的 `type` 字段。
