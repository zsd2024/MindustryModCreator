# Curated Schema 系统设计

## 1. 动机

当前 208 个反射生成的 schema 每个内容类型暴露 50-150+ 个字段，其中 80% 以上在真实 Mod 中从未使用（基于 AdvanceContent、Allure、Fading-Revelations、Viridium 四个 Mod、400+ 文件的数据分析）。对初学者极不友好，有效字段淹没在大量调试/内部属性中。

## 2. 方案概要

- 在 `schemas/curated/` 下手写精简 schema，只收录真实 Mod 中高频使用的字段，附更详尽的说明和格式示例
- 编辑器默认加载 curated 字段
- 新增"高级模式"开关，开启后回退到完整反射 schema（所有原有字段）
- 原有 208 个反射 schema 不动，不删不改

## 3. 文件结构

```
schemas/
├── Block.json                    ← 反射生成（不动）
├── GenericCrafter.json
├── Item.json
├── ...                         ← 208 个反射文件
├── zh_CN/                     ← 反射翻译（不动）
│   ├── Block.json
│   ├── GenericCrafter.json
│   └── ...
├── curated/                   ← 新增：精选字段
│   ├── UnlockableContent.json
│   ├── Block.json
│   ├── GenericCrafter.json
│   ├── Item.json
│   ├── Liquid.json
│   ├── Floor.json
│   ├── Wall.json
│   ├── Turret.json
│   ├── Drill.json
│   ├── UnitType.json
│   ├── UnitFactory.json
│   ├── Conveyor.json
│   ├── PowerNode.json
│   ├── Battery.json
│   ├── ForceProjector.json
│   ├── OverdriveProjector.json
│   ├── BulletType.json
│   └── ...
│   └── types/               ← 可复用的子类型定义
│       ├── StackRequirement.json
│       ├── ConsumePower.json
│       ├── ConsumeItems.json
│       ├── ConsumeLiquid.json
│       ├── Weapon.json
│       ├── Bullet.json
│       ├── Plan.json
│       ├── Shoot.json
│       ├── Research.json
│       └── ...
```

## 4. Curated Schema 格式

与反射 schema 相同的 JSON 格式，新增支持：
- `parentType` 引用同目录下其他 curated 文件
- 嵌套字段（`type: "array"` + `items`、`type: "object"` + `fields`）
- `$ref` 引用 `types/` 下的可复用子类型

### 基础字段

```json
{
    "localizedName": "通用工厂",
    "parentType": "Block",
    "fields": [
        {
            "name": "craftTime",
            "localizedName": "合成时间",
            "type": "float",
            "defaultValue": "80.0",
            "notes": "合成所需 tick 数。\n\n**格式**: `60` 即 1 秒\n**示例**: `120`"
        }
    ]
}
```

### 嵌套对象字段

```json
{
    "name": "shoot",
    "localizedName": "射击配置",
    "type": "object",
    "fields": [
        { "name": "shots", "localizedName": "弹丸数量", "type": "int", "defaultValue": "1" },
        { "name": "shotDelay", "localizedName": "弹丸间隔", "type": "float", "defaultValue": "0" }
    ],
    "notes": "射击行为配置。不填则使用默认射击模式。"
}
```

### 数组 + 引用类型

```json
{
    "name": "requirements",
    "localizedName": "建造需求",
    "type": "array",
    "items": { "$ref": "types/StackRequirement" },
    "notes": "建造所需物品及数量。\n\n**格式示例**: `copper` x 30, `lead` x 20"
}
```

### 可复用子类型 (`types/StackRequirement.json`)

```json
{
    "type": "object",
    "localizedName": "物品需求",
    "fields": [
        { "name": "item", "localizedName": "物品", "type": "Item", "notes": "物品内部名称" },
        { "name": "amount", "localizedName": "数量", "type": "int", "defaultValue": "1" }
    ]
}
```

## 5. 解析逻辑变更 (`resolve-schema.js`)

### 数据独立原则

编辑器 state 中的 `data` 保持平铺结构（`{ craftTime: 80, outputItem: "ore" }`）。嵌套 object 字段的完整对象/数组直接存入 `data[name]`，不展开为深层路径。`handleChange` 处一步到位构造完整值。

### 模式切换

```js
const resolveFields(type, mode = 'curated') {
    if (!type || visited.has(type)) return [];
    visited.add(type);

    const schema = mode === 'curated'
        ? loadCuratedSchema(type) || loadSchema(type)  // curated 优先，无则 fallback
        : loadSchema(type);

    if (!schema) return [];
    const parentFields = schema.parentType
        ? resolveFields(schema.parentType, mode)
        : [];
    const ownFields = (schema.fields || []).map(f => ({
        ...f,
        sourceType: type
    }));
    // 处理嵌套：将 object/array field 的子字段也 attach 到其定义上
    return [...parentFields, ...ownFields];
}
```

### $ref 解析

`resolveFieldRef($ref)` 递归加载 `types/*.json` 中的字段定义并内联。

### 新模式

- `mode = 'curated'`（默认）：先尝试 `loadCuratedSchema`，未找到则 fallback 到 `loadSchema`
- `mode = 'full'`：直接 `loadSchema`，跳过 curated
- `loadCuratedSchema` 使用 `require.context('./schemas/curated', true, /\.json$/)`

## 6. Editor UI 变更

### 高级模式开关

编辑器标题栏新增 toggle：

```
┌─────────────────────────────────────────────┐
│  [contentType 标题]    ⚡ 高级模式  [   ]  │
├─────────────────────────────────────────────┤
│  curated 字段（各分区）                     │
└─────────────────────────────────────────────┘
```

- 切换时重新调用 `resolveFields(type, mode)`，section 自动重组
- 不丢失已填数据（`data` state 独立于 schema）

### 嵌套字段渲染

`renderField` 根据 field.type 分发：

| type 值 | 控件 | 备注 |
|---------|------|------|
| `string` | 文本输入框 | 已有 |
| `int` / `float` | 数字输入框 + 特殊 size 选择器 | 已有 |
| `boolean` | toggle switch | 已有 |
| `Color` | 颜色选择器 | 已有 |
| `Item` / `Liquid` / `Block` 等 | 下拉建议（datalist） | 已有 research 类似模式，扩展为通用引用控件 |
| `object` | 子字段展开渲染 | 递归调用 renderField 渲染 `fields[]` |
| `array` | 可增删列表 | `items.$ref` 指定子类型，每项渲染为一行或面板 |
| 未知 | 文本输入框 | fallback |

### 数组编辑器

数组字段（`requirements`、`weapons`、`plans`、`consumes.liquids` 等）：
- 显示已有项列表，每项可删除
- "添加"按钮，追加新项（从 `items` 初始化默认值）
- 每项根据 `items.type` 渲染控件（对象嵌套、简单类型等）

## 6. 首次覆盖清单（P0 + P1）

| 文件 | 精选字段数 | 继承自 | 说明 |
|------|-----------|--------|------|
| UnlockableContent.json | 10 | - | localizedName, description, details, hidden, alwaysUnlocked, hideDetails, hideDatabase, generateIcons, inlineDescription, research |
| Block.json | 12 | UnlockableContent | health, size, requirements, category, consumes, drawer, hasPower, hasLiquids, hasItems, buildVisibility, itemCapacity, liquidCapacity |
| GenericCrafter.json | 8 | Block | craftTime, outputItem, outputItems, outputLiquid, craftEffect, updateEffect, ambientSound, incinerate |
| Turret.json | 15 | Block | reload, range, inaccuracy, shootCone, shootSound, shoot（object）, ammoTypes, ammo(target), targetAir, targetGround, rotateSpeed, coolantMultiplier, heatColor, shootEffect, smokeEffect |
| Drill.json | 7 | Block | drillTime, tier, range, blockedItems, drillEffect, warmupSpeed, consumeSpeed |
| Item.json | 10 | UnlockableContent | cost, hardness, color, flammability, explosiveness, radioactivity, charge, frames, frameTime, health |
| Liquid.json | 14 | UnlockableContent | color, colorFrom, colorTo, gasColor, temperature, heatCapacity, viscosity, boilPoint, explosiveness, flammability, coolant, gas, effect, blockReactive |
| Floor.json | 8 | Block | blendGroup, variants, speedMultiplier, damageMultiplier, isLiquid, drownTime, hasShadow, wallOreMultiplier |
| Wall.json | 4 | Block | chanceDeflect, flashHit, insulated, armorOverride |
| Conveyor.json | 6 | Block | speed, itemCapacity, armored, underBullet, junctionReplacement, bridgeReplacement |
| PowerNode.json | 5 | Block | laserRange, maxNodes, laserColor, blockLoss, tower |
| Battery.json | 4 | Block | powerCapacity, powerLoss, consumePowerBuffered, basePower |
| ForceProjector.json | 7 | Block | radius, regen, cooldown, max, alpha, phaseUseTime, phaseRadiusBoost |
| UnitType.json | 25 | UnlockableContent | speed, health, armor, hitSize, drag, accel, rotateSpeed, flying, hovering, lowAltitude, engineSize, engineOffset, engineColor, itemCapacity, buildSpeed, mineSpeed, mineTier, weapons（array→ Weapon）, abilities（array→ Ability）, controller, immunities, research, parts, trailLength, outlineColor |
| UnitFactory.json | 5 | Block | plans（array→ Plan）, configurable, shownPlanets, forceTeam, buildSpeedMulti |
| BulletType.json | 20 | - | damage, speed, lifetime, splashDamage, splashRange, width, height, hitSize, pierce, status, statusDuration, shootEffect, smokeEffect, trailEffect, trailColor, trailLength, lightColor, lightOpacity, ammoMultiplier, fragBullet |

### 预计复用子类型（`types/`）

| 文件 | 字段 | 类型 |
|------|------|------|
| StackRequirement.json | item, amount | object |
| ConsumePower.json | usage, capacity, buffered | object |
| ConsumeItems.json | item, amount, optional | object |
| ConsumeLiquid.json | liquid, amount, min | object |
| Weapon.json | name, x, y, reload, rotate, bullet, mirror | object |
| Bullet.json | type, damage, speed, lifetime, splashDamage, ... | object |
| Plan.json | unit, time, requirements | object |
| Shoot.json | shots, shotDelay, spread | object |
| Research.json | parent, requirements, objectives | object/string |

## 7. 不变的部分

### mod-export.js

- `buildContentHjson` — 不需要改（`localizedName → name` 映射不变）
- `diffData` — 不需要改（基于 `computeDefaults` 工作，curated 的 `defaultValue` 不同源计算法逻辑一致）
- `computeDefaults` — 解析默认值逻辑不变

### 编辑器渲染

- 分区折叠逻辑不变
- section 渲染、fieldHint 渲染不变
- `sourceType` tagging 不变（大量依赖已有逻辑）

## 8. 实施顺序（`writing-plans` 阶段细化）

1. 创建 `schemas curated/` 和 `curated/types/` 目录结构
2. 实现 `loadCuratedSchema` + `resolveFields(type, mode)`
3. 编辑器接入 mode 切换开关
4. 实现嵌套 object 渲染
5. 实现数组增删渲染 + 引用类型 `$ref` 解析
6. 扩展引用控件（Item、Liquid 等下拉建议）
7. 编写 P0 内容类型的 curated 文件（UnlockableContent、Block、GenericCrafter、Turret）
8. 编写 types/ 子类型引用文件
9. 编写 P1 内容类型的 curated 文件
10. 验证：默认模式展示少于 20 字段，高级模式展示全部反射字段