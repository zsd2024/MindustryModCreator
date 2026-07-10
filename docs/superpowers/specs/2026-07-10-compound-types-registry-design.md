# 复合类型注册表设计

## 目标

让 JSON 编辑器正确处理 full schema 中所有非基础、非引用的字符串类型名，包括：
- **复合对象**：`ItemStack`、`LiquidStack`、`PathCost`、`ItemBridgeBuild` 等
- **数组类型**：`ItemStack[]`、`TextureRegion[]`、`int[]`、`TextureRegion[][]` 等
- **Seq 类型**：`Seq of Item`、`Seq of DrawPart` 等
- **Map 类型**：`ObjectMap of Item, BulletType`、`ObjectFloatMap of Item` 等
- **枚举类型**：`Effect`、`Interp`、`Blending`、`CacheLayer`、`BlockGroup`、`BlockFlag`、`Team`、`Attribute`、`Sortf`、`Stat` 等

## 设计方案 — 复合类型注册表 + 类型名归一化

### 1. COMPOUND_TYPES 注册表

新增常量（在 `mindustry-json-editor.jsx` 或独立文件 `compound-types.js`），定义每个非基础类型的内部结构：

```js
const COMPOUND_TYPES = {
  // 物品数量
  ItemStack: {
    type: 'object',
    fields: [
      {name: 'item', type: 'Item'},
      {name: 'amount', type: 'int', defaultValue: 1},
    ],
  },
  // 液体数量
  LiquidStack: {
    type: 'object',
    fields: [
      {name: 'liquid', type: 'Liquid'},
      {name: 'amount', type: 'float', defaultValue: 1},
    ],
  },
  // 单位路径消耗
  PathCost: {
    type: 'object',
    fields: [
      {name: 'type', type: 'Block'},
      {name: 'cost', type: 'float', defaultValue: 1},
    ],
  },
  // 物品桥配置
  ItemBridgeBuild: {
    type: 'object',
    fields: [
      {name: 'item', type: 'Item'},
      {name: 'sort', type: 'boolean'},
    ],
  },
};
```

### 2. normalizeType 函数

```js
function normalizeType(field) {
  let type = field.type;
  
  // 已经结构化
  if (type === 'object' || type === 'array') return field;
  
  // 查复合类型注册表
  if (COMPOUND_TYPES[type]) {
    return { ...field, ...COMPOUND_TYPES[type] };
  }
  
  // 处理 [] 后缀 (支持多维: TextureRegion[][])
  const arrayMatch = type.match(/^(.+?)((?:\[\])+)$/);
  if (arrayMatch) {
    const baseType = arrayMatch[1];
    const arrayDepth = arrayMatch[2].length / 2;
    let items = { type: baseType };
    // 多维: 递归包装
    for (let i = 1; i < arrayDepth; i++) {
      items = { type: 'array', items };
    }
    return { ...field, type: 'array', items };
  }
  
  // 处理 Seq of X
  const seqMatch = type.match(/^Seq of (.+)$/);
  if (seqMatch) {
    return { ...field, type: 'array', items: { type: seqMatch[1] } };
  }
  
  // 处理 ObjectMap of K, V - 渲染为 [{key: K, value: V}] 数组
  const mapMatch = type.match(/^Object(Map|FloatMap) of (.+?),\s*(.+)$/);
  if (mapMatch) {
    const keyType = mapMatch[2];
    const valType = mapMatch[3];
    return {
      ...field,
      type: 'array',
      items: {
        type: 'object',
        fields: [
          {name: 'key', type: keyType, localizedName: '键'},
          {name: 'value', type: valType, localizedName: '值'},
        ],
      },
    };
  }
  
  // 处理 ObjectSet of X - 渲染为 [{value: X}] 数组
  const setMatch = type.match(/^ObjectSet of (.+)$/);
  if (setMatch) {
    return {
      ...field,
      type: 'array',
      items: {
        type: 'object',
        fields: [
          {name: 'value', type: setMatch[1], localizedName: '值'},
        ],
      },
    };
  }
  
  return field;
}
```

### 3. renderField 修改

在 `renderField` 的 type 判断之前调用 `normalizeType(field)`：

```js
renderField(rawField) {
  const field = normalizeType(rawField);
  // ... 后续 type === 'object' / 'array' / else 逻辑不变
}
```

这样 `"type": "ItemStack"` 被归一化为 `{type: 'object', fields: [...]}` 后，走 `renderObjectField`。
`"type": "ItemStack[]"` 被归一化为 `{type: 'array', items: {type: 'object', fields: [...]}}` 后，走 `renderArrayField`。

### 4. 枚举类型扩展

在 `ENUM_VALUES` 中添加新类型映射：

| 类型 | 值 | 来源 |
|------|-----|------|
| `Effect` | 保留为文本输入（值太多） | - |
| `Interp` | pow2, pow3, pow4, pow5, linear, fast, slow, ... | 游戏源码 |
| `Blending` | additive, normal, alpha, disabled | 游戏源码 |
| `CacheLayer` | normal, walls, water, tar, molten | 游戏源码 |
| `BlockGroup` | none, walls, projectors, turrets, transportation, ... | 游戏源码 |
| `BlockFlag` | none, core, reactor, generator, drill, factory, battery, ... | 游戏源码 |
| `Team` | 不处理（通过 field.options 或引用）| - |
| `Attribute` | water, heat, oil, sand, ... | 游戏源码 |
| `Sortf` | closest, farthest, health, maxHealth, ... | 游戏源码 |

### 5. 不处理的类型

- Java 函数式类型：`Prov of ...`, `Func of ...`, `Cons of ...`, `Boolf of ...`, `Class of ?`
- 极稀有内部类型：`Rect[]`, `Texture`, `GenericMesh`, `Rules`, `Sector`, `FileMapGenerator`, `Music`, `IntIntMap`, `Object`, `EnumSet of BlockFlag`
- `DrawBlock` / `Consume` / `ShootPattern` / `Weapon`：这些是多态类型，有大量子类，处理方式不同（已有 curated 定义）

## 文件变更

| 文件 | 变更 |
|------|------|
| `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx` | 添加 `COMPOUND_TYPES`、`normalizeType`、修改 `renderField`、扩展 `ENUM_VALUES` |
| (可选) `packages/turbowarp/src/lib/mindustry/compound-types.js` | 抽离 `COMPOUND_TYPES` 和 `normalizeType` 到独立模块 |

## 测试验证

1. 编辑一个 GenericCrafter 的 `outputItem` 字段（`ItemStack` 类型）→ 应渲染为 item + amount 嵌套对象
2. 编辑一个 Block 的 `requirements` 字段（`ItemStack[]` 类型）→ 应渲染为 ItemStack 数组编辑器
3. 编辑 `int[]` 类型字段 → 应渲染为数字数组编辑器
4. 编辑 `Seq of Item` 类型字段 → 应渲染为 Item 数组编辑器
5. 编辑 `Interp` 类型字段 → 应渲染为搜索枚举下拉框
