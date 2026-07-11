# Special Fields

## forceTeam (队伍选择器)
- field.name === 'forceTeam' 触发特殊渲染
- 选项: -1 (默认) + 0~255 (全部 Mindustry 队伍)
- 颜色使用 xorshift128+ RNG 复现原版（seed=8, murmurHash3）
- 0~6 有固定名字和颜色（来自 Team.java）
  - 0=灰(Derelict) `#4d4e58`
  - 1=黄(Sharded) `#ffd37f`
  - 2=红(Crux) `#f25555`
  - 3=紫(Malis) `#a27ce5`
  - 4=绿(Green) `#54d67d`
  - 5=蓝(Blue) `#6c87fd`
  - 6=Neoplastic `#e05438`
- 渲染: `renderSearchableSelect` 带颜色
- onChange: `parseInt(val, 10)`

## research
- 字符串 → 内容选择器（显示所有类型）
- 对象 → 展开子字段: parent, objectives, requirements
- parent: 内容引用选择器

## Compound Types (`compound-types.js`)
Schema 中 type 字段可以是复合类型字符串，`normalizeType()` 处理展开：
- `ItemStack` → `{item: Item, amount: int}`
- `LiquidStack` → `{liquid: Liquid, amount: int}`
- `Type[]` → array of type
- `Seq of X` → array of X
- `ObjectMap of K, V` → array of {key: K, value: V}

## size
- 特殊渲染：网格选择器（1x1 ~ 5x5）+ 自定义数字输入
