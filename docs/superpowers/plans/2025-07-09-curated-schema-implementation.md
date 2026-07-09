# Curated Schema System 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 curated schema 编辑器，默认显示精选字段，高级模式开关回退到完整反射字段。

**Architecture:** 在 schemas/curated/ 下手写精简 JSON schema（支持嵌套 object/array + `$ref` 引用类型）。`resolveFields(type, mode)` 根据模式切换加载源。编辑器新增高级模式 toggle 和嵌套表单渲染。

**Tech Stack:** React (TurboWarp), webpack (require.context), HJSON, bun (运行脚本)

## Global Constraints

- 原有 schemas/ 下 208 个反射文件不动、不删、不改
- zh_CN 翻译 notes 直接写在 curated JSON 的 notes 字段中
- data state 保持平铺结构，不改为深层路径
- 高级模式切换不丢失已填数据
- 纯静态 HTML，无后端依赖

---

## 文件结构总览

```
schemas/curated/                          ← 新建
├── UnlockableContent.json                ← P0: 基类
├── Block.json                            ← P0: 继承 UnlockableContent
├── GenericCrafter.json                   ← P0: 继承 Block
├── ItemTurret.json                       ← P0: 继承 Turret
├── Drill.json                            ← P1
├── Item.json                             ← P0
├── Liquid.json                           ← P0
├── Floor.json                            ← P1
├── Wall.json                             ← P1
├── PowerNode.json                        ← P1
├── UnitType.json                         ← P1
├── UnitFactory.json                      ← P1
├── BulletType.json                       ← P1
└── types/                                ← 新建: 可复用子类型
    ├── StackRequirement.json
    ├── ConsumePower.json
    ├── ConsumeItems.json
    ├── ConsumeLiquid.json
    ├── Weapon.json
    ├── Bullet.json
    ├── Plan.json
    ├── Shoot.json
    └── Research.json

resolve-schema.js                         ← 修改: +mode, +loadCuratedSchema, +$ref
mindustry-json-editor.jsx                 ← 修改: +toggle, +嵌套渲染, +数组编辑
mindustry-json-editor.module.css          ← 修改: +样式
```

---

### Task 1: 实现 resolveFields 模式切换 + curated 加载

**Files:**
- Modify: `packages/turbowarp/src/lib/mindustry/resolve-schema.js`
- Test: `scripts/field-usage-report.json` (用于验证 curated 字段加载)

**Interfaces:**
- Produces: `resolveFields(type, mode = 'curated')` — 返回字段数组，mode 可选 `'curated'` | `'full'`
- Produces: `loadCuratedSchema(type)` — 加载 `schemas/curated/{type}.json`，未找到返回 null

- [ ] **Step 1: 在 resolve-schema.js 添加 curated context 加载**

在 `schemasContext` 旁边添加：
```js
const curatedSchemasContext = require.context(
  './schemas/curated', true, /\.json$/
);
const curatedSchemaCache = {};

const loadCuratedSchema = function (type) {
  if (curatedSchemaCache[type]) return curatedSchemaCache[type];
  try {
    const key = `./${type}.json`;
    if (curatedSchemasContext.keys().includes(key)) {
      curatedSchemaCache[type] = curatedSchemasContext(key);
      return curatedSchemaCache[type];
    }
  } catch (e) {
    // not found
  }
  return null;
};
```

- [ ] **Step 2: 修改 resolveFields 加 mode 参数**

```js
const resolveFields = function (type, mode = 'curated', visited = new Set()) {
  if (!type || visited.has(type)) return [];
  visited.add(type);

  const schema = mode === 'curated'
    ? (loadCuratedSchema(type) || loadSchema(type))
    : loadSchema(type);

  if (!schema) return [];

  const parentFields = schema.parentType
    ? resolveFields(schema.parentType, mode, visited)
    : [];

  const ownFields = (schema.fields || []).map(f => ({
    ...f,
    sourceType: type
  }));

  return [...parentFields, ...ownFields];
};
```

- [ ] **Step 3: 修改 computeDefaults 同步**

找到 `computeDefaults` 函数（依赖 `resolveFields`），修改调用链使 `diffData` 也能感知 mode。不做大改——`computeDefaults` 只用于导出对比，默认用 `mode='full'` 以保证默认值稳定：

```js
const computeDefaults = function (contentType) {
  const fields = resolveFields(contentType, 'full');
  // ... rest unchanged
};
```

- [ ] **Step 4: 验证加载**

```bash
bun -e "
const { resolveFields } = require('./packages/turbowarp/src/lib/mindustry/resolve-schema.js');
// 先验证 curate 文件夹为空时不崩溃
const curatedFields = resolveFields('GenericCrafter', 'curated');
console.log('curated mode (empty):', curatedFields.length, 'fields');
const fullFields = resolveFields('GenericCrafter', 'full');
console.log('full mode:', fullFields.length, 'fields');
"
```
预期：curated mode 在文件夹为空时走 fallback 到 full，两者字段数相同。

- [ ] **Step 5: Commit**

```bash
git add packages/turbowarp/src/lib/mindustry/resolve-schema.js
git commit -m "feat: resolveFields 加 mode 参数，支持 curated/full 切换"
```

---

### Task 2: 实现 `$ref` 引用类型解析

**Files:**
- Modify: `packages/turbowarp/src/lib/mindustry/resolve-schema.js`

**Interfaces:**
- Produces: `resolveFieldRef($ref)` — 递归加载 `types/*.json` 中的定义并缓存

- [ ] **Step 1: 添加 `$ref` 解析函数**

```js
const resolveFieldRef = function (refPath) {
  // refPath 格式: "types/StackRequirement"
  // 从 curatedSchemasContext 加载
  const key = `./types/${refPath.replace('types/', '')}.json`;
  try {
    if (curatedSchemasContext.keys().includes(key)) {
      const def = curatedSchemasContext(key);
      return def.fields || [];
    }
  } catch (e) { /* fall through */ }
  return [];
};
```

- [ ] **Step 2: 修改 resolveFields 展开 `$ref`**

在 `ownFields` 映射逻辑中处理 `$ref`：

```js
const resolveFieldWithRef = function (f) {
  if (f.$ref) {
    // $ref 独立字段：整个字段内容来自引用类型
    // 实际使用中不会出现在 curated 的顶级 fields 中，而是出现在 items.$ref 中
    return resolveFieldRef(f.$ref);
  }
  if (f.items && f.items.$ref) {
    // array 类型的 items 来自引用
    return [{
      ...f,
      items: {
        type: 'object',
        fields: resolveFieldRef(f.items.$ref),
        refFrom: f.items.$ref,
      }
    }];
  }
  return [f];
};
```

然后 `ownFields` 改为：
```js
const ownFields = (schema.fields || []).flatMap(f => resolveFieldWithRef(f)).map(f => ({
  ...f,
  sourceType: type
}));
```

- [ ] **Step 3: Commit**

```bash
git add packages/turbowarp/src/lib/mindustry/resolve-schema.js
git commit -m "feat: $ref 引用类型解析（schemas/curated/types/*.json）"
```

---

### Task 3: 编辑器添加高级模式开关

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.module.css`

- [ ] **Step 1: 添加 state 和 toggle 方法**

在 constructor 中加 state：
```js
this.state = {
  data: this.initData(props.contentType, props.initialData || {}),
  collapsedSections: this.initCollapsedSections(props.contentType),
  advancedMode: false,  // ← 新增
};
```

添加 toggle 方法：
```js
toggleAdvancedMode() {
  this.setState(prev => ({ advancedMode: !prev.advancedMode }));
}
```

- [ ] **Step 2: 修改 render 使用 mode 参数**

在 `render` 方法中，`resolveFields` 调用改为：
```js
const mode = this.state.advancedMode ? 'full' : 'curated';
const fields = resolveFields(contentType, mode);
```

- [ ] **Step 3: 渲染 toggle UI**

在 editorHeader 中添加开关（在标题后方）：
```jsx
<div className={styles.editorHeader}>
  <span className={styles.editorTitle}>{getZhLabel(contentType) || contentType}</span>
  <label className={styles.advancedToggle}>
    <span className={styles.advancedToggleLabel}>⚡ 高级模式</span>
    <span className={styles.toggleSwitch}>
      <input
        type="checkbox"
        checked={this.state.advancedMode}
        onChange={() => this.toggleAdvancedMode()}
      />
      <span className={styles.toggleSlider} />
    </span>
  </label>
</div>
```

- [ ] **Step 4: 添加 CSS**

在 `mindustry-json-editor.module.css` 中添加：
```css
.editorHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* ... 已有样式 ... */
}

.advancedToggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.advancedToggleLabel {
  font-size: 12px;
  color: var(--text-secondary, #888);
}

.toggleSwitch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.toggleSwitch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggleSlider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--toggle-bg, #555);
  border-radius: 20px;
  transition: 0.2s;
}

.toggleSlider::before {
  content: '';
  position: absolute;
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
}

.toggleSwitch input:checked + .toggleSlider {
  background-color: var(--accent, #ffb013);
}

.toggleSwitch input:checked + .toggleSlider::before {
  transform: translateX(16px);
}
```

- [ ] **Step 5: 验证切换**

构建并确认：
1. 默认状态字段少（~15-25 个）
2. 开启高级模式后字段变多（50-150 个）
3. 切换时已填数据不丢失（切换前后 data 不变）

- [ ] **Step 6: Commit**

```bash
git add packages/turbowarp/src/components/mindustry-json-editor/
git commit -m "feat: 编辑器高级模式开关（curated/full 切换）"
```

---

### Task 4: 实现嵌套 object 渲染

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`

- [ ] **Step 1: 添加嵌套字段判断逻辑**

在 `renderField` 方法中，`renderControl()` 开头添加分支：

```js
const renderControl = () => {
  // nested object
  if (field.type === 'object' && field.fields) {
    return this.renderObjectField(field, value);
  }
  // nested array
  if (field.type === 'array' && (field.items || field.itemType)) {
    return this.renderArrayField(field, value);
  }
  // ... 已有 boolean, Color, int/float, research 分支 ...
};
```

- [ ] **Step 2: 实现 renderObjectField**

```js
renderObjectField(field, value) {
  const currentValue = value || {};
  const subFields = field.fields || [];
  return (
    <div className={styles.nestedObject}>
      {subFields.map(subF => {
        const subValue = currentValue[subF.name] !== undefined
          ? currentValue[subF.name]
          : this.parseDefault(subF);
        return (
          <div className={styles.nestedFieldRow} key={subF.name}>
            <span className={styles.nestedFieldLabel}>
              {getFieldLabel(field.sourceType, subF.name) || subF.localizedName || subF.name}
            </span>
            <div className={styles.nestedFieldControl}>
              {this.renderControlInline(subF, subValue, (newVal) => {
                const updated = { ...currentValue, [subF.name]: newVal };
                this.handleChange(field.name, updated);
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 提取 renderControlInline（复用控件逻辑但接受 onChange 回调）**

```js
renderControlInline(field, value, onChange) {
  // 与 renderControl 逻辑相同，但用 onChange 参数替代 this.handleChange(field.name, ...)
  if (field.type === 'boolean') {
    return (
      <label className={styles.toggleSwitch}>
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
        <span className={styles.toggleSlider} />
      </label>
    );
  }
  if (field.type === 'Color') { /* color picker 逻辑 */ }
  if (field.type === 'int' || field.type === 'float') { /* number input */ }
  // fallback: text input
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} />;
}
```

- [ ] **Step 4: 添加 CSS**

```css
.nestedObject {
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  padding: 8px;
  margin: 4px 0;
  background: var(--bg-secondary, #1a1a1a);
}

.nestedFieldRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}

.nestedFieldLabel {
  font-size: 12px;
  color: var(--text-secondary, #aaa);
  min-width: 80px;
}

.nestedFieldControl {
  flex: 1;
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/turbowarp/src/components/mindustry-json-editor/
git commit -m "feat: 嵌套 object 字段递归渲染"
```

---

### Task 5: 实现数组编辑器（增删改）

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.module.css`

- [ ] **Step 1: 实现 renderArrayField**

```js
renderArrayField(field, value) {
  const items = Array.isArray(value) ? value : [];
  const itemDef = field.items;
  const subFields = itemDef && (itemDef.fields || (itemDef.refPath
    ? resolveFieldRef(itemDef.refPath) : []));

  const addItem = () => {
    const defaults = {};
    if (subFields) {
      for (const sf of subFields) {
        if (sf.defaultValue !== undefined) {
          defaults[sf.name] = this.parseDefault(sf);
        }
      }
    }
    const newItems = [...items, defaults];
    this.handleChange(field.name, newItems);
  };

  const removeItem = (idx) => {
    const newItems = items.filter((_, i) => i !== idx);
    this.handleChange(field.name, newItems);
  };

  const updateItem = (idx, name, val) => {
    const newItems = items.map((item, i) =>
      i === idx ? { ...item, [name]: val } : item
    );
    this.handleChange(field.name, newItems);
  };

  return (
    <div className={styles.arrayField}>
      {items.length === 0 && (
        <div className={styles.arrayEmpty}>暂未添加</div>
      )}
      {items.map((item, idx) => (
        <div className={styles.arrayItem} key={idx}>
          <div className={styles.arrayItemHeader}>
            <span className={styles.arrayItemIndex}>#{idx + 1}</span>
            <button className={styles.arrayRemoveBtn} onClick={() => removeItem(idx)}>✕</button>
          </div>
          <div className={styles.arrayItemBody}>
            {subFields
              ? subFields.map(sf => (
                  <div className={styles.nestedFieldRow} key={sf.name}>
                    <span className={styles.nestedFieldLabel}>
                      {getFieldLabel(field.sourceType, sf.name) || sf.localizedName || sf.name}
                    </span>
                    <div className={styles.nestedFieldControl}>
                      {this.renderControlInline(sf, item[sf.name], (val) => updateItem(idx, sf.name, val))}
                    </div>
                  </div>
                ))
              : <input type="text" value={item} onChange={e => updateItem(idx, null, e.target.value)} />
            }
          </div>
        </div>
      ))}
      <button className={styles.arrayAddBtn} onClick={addItem}>+ 添加</button>
    </div>
  );
}
```

- [ ] **Step 2: 添加 CSS**

```css
.arrayField {
  /* container */
}

.arrayEmpty {
  color: var(--text-tertiary, #555);
  font-size: 12px;
  padding: 8px;
  text-align: center;
}

.arrayItem {
  border: 1px solid var(--border-color, #333);
  border-radius: 4px;
  margin: 4px 0;
  padding: 8px;
  background: var(--bg-secondary, #1a1a1a);
}

.arrayItemHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.arrayItemIndex {
  font-size: 11px;
  color: var(--text-tertiary, #666);
  font-weight: bold;
}

.arrayRemoveBtn {
  background: none;
  border: none;
  color: #f44;
  cursor: pointer;
  font-size: 14px;
  padding: 0 4px;
}

.arrayAddBtn {
  width: 100%;
  padding: 6px;
  margin-top: 4px;
  background: var(--btn-secondary-bg, #2a2a2a);
  border: 1px dashed var(--border-color, #555);
  border-radius: 4px;
  color: var(--text-secondary, #aaa);
  cursor: pointer;
  font-size: 12px;
}

.arrayAddBtn:hover {
  background: var(--btn-secondary-hover, #333);
}
```

- [ ] **Step 3: 在 fieldHint 下方显示数组长度提示**

修改 fieldRow 渲染——当字段是 array 类型时，在 hint 后面显示当前数量：
```jsx
{field.type === 'array' && Array.isArray(value) && (
  <span className={styles.fieldCount}>{value.length} 项</span>
)}
```

- [ ] **Step 4: Commit**

```bash
git add packages/turbowarp/src/components/mindustry-json-editor/
git commit -m "feat: 数组编辑器（增删改 + 子字段渲染）"
```

---

### Task 6: 扩展内容引用控件（Item/Liquid/Block 等类型）

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`

- [ ] **Step 1: 识别引用类型列表**

```js
const REFERENCE_TYPES = new Set([
  'Item', 'Liquid', 'Block', 'UnitType', 'BulletType',
  'StatusEffect', 'Weather', 'Planet', 'SectorPreset',
  'Sound', 'TextureRegion',
]);
```

- [ ] **Step 2: 在 renderControlInline 中添加引用类型分支**

在 text input fallback 之前：
```js
if (REFERENCE_TYPES.has(field.type)) {
  return this.renderReferenceInput(field, value, onChange);
}
```

- [ ] **Step 3: 实现 renderReferenceInput**

```js
renderReferenceInput(field, value, onChange) {
  const { assets } = this.props;
  const suggestions = assets
    ? assets.map(a => a.name).filter(Boolean)
    : [];
  const listId = `ref-${field.name}-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <>
      <input
        type="text"
        value={value || ''}
        list={listId}
        onChange={e => onChange(e.target.value)}
        placeholder={`输入${field.localizedName || field.name}名称...`}
      />
      <datalist id={listId}>
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </>
  );
}
```

- [ ] **Step 4: 整合已有的 research 特殊处理**

将原有的 `field.name === 'research'` 特殊处理整合进来——因为 research 字段的 type 可能是 `Research`（string 或 object），复用 reference input + 自定义渲染。

- [ ] **Step 5: Commit**

```bash
git add packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx
git commit -m "feat: 通用引用类型控件（Item/Liquid/Block 等 datalist）"
```

---

### Task 7: 编写 P0 curated 文件 — 基类 + 方块

**Files:**
- Create: `schemas/curated/UnlockableContent.json`
- Create: `schemas/curated/Block.json`
- Create: `schemas/curated/GenericCrafter.json`
- Create: `schemas/curated/ItemTurret.json`

**数据来源依据:** `scripts/field-usage-report.json`

- [ ] **Step 1: 创建 UnlockableContent.json**

基于 report 数据，所有类型共用的字段：
```json
{
    "localizedName": "可解锁内容",
    "fields": [
        {
            "name": "localizedName",
            "localizedName": "显示名称",
            "type": "string",
            "notes": "此内容在游戏内显示的名称。\n\n支持 bundle 本地化。"
        },
        {
            "name": "description",
            "localizedName": "描述",
            "type": "string",
            "notes": "描述文本。多行文本使用 HJSON 的 ''' 包裹。"
        },
        {
            "name": "details",
            "localizedName": "详细信息",
            "type": "string",
            "notes": "在核心数据库中显示的详细说明。"
        },
        {
            "name": "hidden",
            "localizedName": "隐藏",
            "type": "boolean",
            "defaultValue": "false",
            "notes": "开启后此内容在核心数据库中隐藏。"
        },
        {
            "name": "alwaysUnlocked",
            "localizedName": "始终解锁",
            "type": "boolean",
            "defaultValue": "false",
            "notes": "开启后此内容在科技树中始终可用。"
        },
        {
            "name": "research",
            "localizedName": "科技树父节点",
            "type": "Research",
            "notes": "父节点名称或复杂研究对象。填写父节点的文件名称。\n\n简单: `\"copper-wall\"`\n复杂: `{parent: \"copper-wall\", requirements: [\"copper/1\"]}`"
        }
    ]
}
```

- [ ] **Step 2: 创建 Block.json**

从 report 中选取 Block 及其子类高频字段（所有方块共用）：
```json
{
    "localizedName": "方块",
    "parentType": "UnlockableContent",
    "fields": [
        {
            "name": "size",
            "localizedName": "尺寸",
            "type": "int",
            "defaultValue": "1",
            "notes": "方块占用的网格大小。1=1x1, 2=2x2, ...\n\n常用值: 1, 2, 3, 4, 5"
        },
        {
            "name": "health",
            "localizedName": "耐久度",
            "type": "int",
            "defaultValue": "40",
            "notes": "方块的生命值。"
        },
        {
            "name": "requirements",
            "localizedName": "建造需求",
            "type": "array",
            "items": { "$ref": "types/StackRequirement" },
            "notes": "建造所需物品及数量。\n\n格式: `{item: \"copper\", amount: 10}`"
        },
        {
            "name": "category",
            "localizedName": "建造分类",
            "type": "string",
            "notes": "建造菜单中的分类。\n\n可选值: `crafting`, `production`, `distribution`, `liquid`, `power`, `defense`, `turret`, `units`, `effect`"
        },
        {
            "name": "consumes",
            "localizedName": "消耗配置",
            "type": "object",
            "fields": [
                { "name": "power", "localizedName": "耗电", "type": "object", "items": { "$ref": "types/ConsumePower" } },
                { "name": "items", "localizedName": "消耗物品", "type": "array", "items": { "$ref": "types/ConsumeItems" } },
                { "name": "liquid", "localizedName": "消耗液体", "type": "object", "items": { "$ref": "types/ConsumeLiquid" } }
            ],
            "notes": "方块的消耗配置（电力/物品/液体）。仅配置需要的部分。"
        },
        {
            "name": "drawer",
            "localizedName": "渲染器",
            "type": "string",
            "notes": "方块的渲染方式。大部分方块不需要填写。\n\n常见: `DrawDefault`（默认）, `DrawMulti`, `DrawLiquidTile`, `DrawRegion`"
        },
        {
            "name": "hasPower",
            "localizedName": "有电力面板",
            "type": "boolean",
            "notes": "开启后显示电力连接面板。"
        },
        {
            "name": "hasLiquids",
            "localizedName": "有液体面板",
            "type": "boolean",
            "notes": "开启后显示液体连接面板。"
        },
        {
            "name": "hasItems",
            "localizedName": "有物品面板",
            "type": "boolean",
            "notes": "开启后显示物品面板。"
        },
        {
            "name": "itemCapacity",
            "localizedName": "物品容量",
            "type": "int",
            "notes": "方块可存储的最大物品数。"
        },
        {
            "name": "liquidCapacity",
            "localizedName": "液体容量",
            "type": "int",
            "notes": "方块可存储的最大液体量（单位）。"
        },
        {
            "name": "buildVisibility",
            "localizedName": "建造可见性",
            "type": "string",
            "notes": "建造可见性。\n\n可选: `shown`（默认）, `hidden`, `shardedOnly`, `campaignOnly`, `sandboxOnly`, `editorOnly`, `debugOnly`"
        }
    ]
}
```

- [ ] **Step 3: 创建 GenericCrafter.json**

```json
{
    "localizedName": "通用工厂",
    "parentType": "Block",
    "fields": [
        {
            "name": "craftTime",
            "localizedName": "合成时间",
            "type": "float",
            "defaultValue": "80",
            "notes": "合成一个单位所需的 tick 数。60 tick = 1 秒。\n\n较小的数字 = 更快。"
        },
        {
            "name": "outputItem",
            "localizedName": "输出物品",
            "type": "object",
            "fields": [
                { "name": "item", "localizedName": "物品", "type": "Item", "notes": "输出物品的内部名称。" },
                { "name": "amount", "localizedName": "数量", "type": "int", "defaultValue": "1", "notes": "每次合成输出数量。" }
            ],
            "notes": "合成的输出物品。\n\n简单写法: `\"copper\"`\n完整写法: `{item: \"copper\", amount: 2}`"
        },
        {
            "name": "outputItems",
            "localizedName": "多输出物品",
            "type": "array",
            "items": { "$ref": "types/StackRequirement" },
            "notes": "多物品输出（替代 outputItem）。\n\n`[{item: \"copper\", amount: 2}, {item: \"lead\", amount: 1}]`"
        },
        {
            "name": "outputLiquid",
            "localizedName": "输出液体",
            "type": "object",
            "fields": [
                { "name": "liquid", "localizedName": "液体", "type": "Liquid", "notes": "输出液体的内部名称。" },
                { "name": "amount", "localizedName": "产量", "type": "float", "defaultValue": "10", "notes": "每次合成输出量（单位/秒）。" }
            ],
            "notes": "作为副产品输出的液体。\n\n格式: `{liquid: \"water\", amount: 10}`"
        },
        {
            "name": "craftEffect",
            "localizedName": "合成特效",
            "type": "string",
            "notes": "合成时播放的效果。\n\n常用: `smoke`, `fire`, `explosion`, `pollution`"
        },
        {
            "name": "updateEffect",
            "localizedName": "运行特效",
            "type": "string",
            "notes": "运行持续播放的效果。"
        }
    ]
}
```

- [ ] **Step 4: 创建 ItemTurret.json**

```json
{
    "localizedName": "物品炮塔",
    "parentType": "Block",
    "fields": [
        {
            "name": "reload",
            "localizedName": "装弹时间",
            "type": "float",
            "defaultValue": "10",
            "notes": "两次射击之间的间隔（tick）。"
        },
        {
            "name": "range",
            "localizedName": "射程",
            "type": "float",
            "defaultValue": "80",
            "notes": "炮塔的最大射程（格数）。"
        },
        {
            "name": "inaccuracy",
            "localizedName": "散布",
            "type": "float",
            "defaultValue": "0",
            "notes": "射击的随机散布角度。值越大越不精确。"
        },
        {
            "name": "shootCone",
            "localizedName": "射击锥角",
            "type": "float",
            "defaultValue": "15",
            "notes": "炮塔可射击的角度范围（度数）。"
        },
        {
            "name": "shootSound",
            "localizedName": "射击音效",
            "type": "Sound",
            "notes": "射击时播放的音效。\n\n常见: `pew`, `bang`, `shotgun`, `laser`, `artillery`"
        },
        {
            "name": "shoot",
            "localizedName": "射击模式",
            "type": "object",
            "items": { "$ref": "types/Shoot" },
            "notes": "射击行为配置。\n\n默认单发。`{shots: 3, shotDelay: 4}` 为三连发。"
        },
        {
            "name": "ammo",
            "localizedName": "弹药",
            "type": "string",
            "notes": "炮塔使用的弹药物品名称。仅在自定义弹药时使用。\n\n示例: `\"硅\"`, `\"thorium\"`"
        },
        {
            "name": "targetAir",
            "localizedName": "可对空",
            "type": "boolean",
            "defaultValue": "true",
            "notes": "能否攻击空中单位。"
        },
        {
            "name": "targetGround",
            "localizedName": "可对地",
            "type": "boolean",
            "defaultValue": "true",
            "notes": "能否攻击地面单位。"
        },
        {
            "name": "rotateSpeed",
            "localizedName": "旋转速度",
            "type": "float",
            "defaultValue": "10",
            "notes": "炮塔旋转速度（度/秒）。"
        },
        {
            "name": "coolantMultiplier",
            "localizedName": "冷却倍率",
            "type": "float",
            "notes": "液体冷却对装弹速度的加成倍率。\n\n常用: `2` ~ `4`"
        },
        {
            "name": "heatColor",
            "localizedName": "热力颜色",
            "type": "Color",
            "notes": "炮管发热时的颜色。\n\n格式: `RRGGBB` 或 `RRGGBBAA`"
        }
    ]
}
```

- [ ] **Step 5: 验证**

在编辑器中验证 GenericCrafter 展示 ~15 个字段（之前 ~130 个），高级模式切换回全部。

- [ ] **Step 6: Commit**

```bash
git add schemas/curated/
git commit -m "feat: curated P0 文件（UnlockableContent/Block/GenericCrafter/ItemTurret）"
```

---

### Task 8: 编写 types/ 可复用子类型定义

**Files:**
- Create: `schemas/curated/types/StackRequirement.json`
- Create: `schemas/curated/types/ConsumePower.json`
- Create: `schemas/curated/types/ConsumeItems.json`
- Create: `schemas/curated/types/ConsumeLiquid.json`
- Create: `schemas/curated/types/Shoot.json`
- Create: `schemas/curated/types/Research.json`

- [ ] **Step 1: types/StackRequirement.json**

```json
{
    "type": "object",
    "localizedName": "物品需求",
    "fields": [
        { "name": "item", "localizedName": "物品", "type": "Item", "notes": "物品的内部名称。" },
        { "name": "amount", "localizedName": "数量", "type": "int", "defaultValue": "1", "notes": "所需数量。" }
    ]
}
```

- [ ] **Step 2: types/ConsumePower.json**

```json
{
    "type": "object",
    "localizedName": "电力消耗",
    "fields": [
        { "name": "usage", "localizedName": "耗电量", "type": "float", "defaultValue": "1", "notes": "每 tick 消耗电力。" },
        { "name": "capacity", "localizedName": "电容", "type": "float", "notes": "缓冲电量上限。" },
        { "name": "buffered", "localizedName": "缓冲", "type": "boolean", "defaultValue": "false", "notes": "启用电力缓冲（无电网时可用）。" }
    ]
}
```

- [ ] **Step 3: types/ConsumeItems.json**

```json
{
    "type": "object",
    "localizedName": "物品消耗",
    "fields": [
        { "name": "item", "localizedName": "物品", "type": "Item", "notes": "消耗的物品。" },
        { "name": "amount", "localizedName": "数量", "type": "int", "defaultValue": "1", "notes": "每次消耗量。" }
    ]
}
```

- [ ] **Step 4: types/ConsumeLiquid.json**

```json
{
    "type": "object",
    "localizedName": "液体消耗",
    "fields": [
        { "name": "liquid", "localizedName": "液体", "type": "Liquid", "notes": "消耗的液体。" },
        { "name": "amount", "localizedName": "数量", "type": "float", "defaultValue": "0.1", "notes": "每次消耗量（单位/秒）。" }
    ]
}
```

- [ ] **Step 5: types/Shoot.json**

```json
{
    "type": "object",
    "localizedName": "射击模式",
    "fields": [
        { "name": "shots", "localizedName": "弹丸数", "type": "int", "defaultValue": "1", "notes": "每次射击发射的弹丸数量。" },
        { "name": "shotDelay", "localizedName": "弹丸间隔", "type": "float", "defaultValue": "0", "notes": "多弹丸之间的发射间隔（tick）。" }
    ]
}
```

- [ ] **Step 6: types/Research.json**

```json
{
    "type": "object",
    "localizedName": "科技树节点",
    "fields": [
        { "name": "parent", "localizedName": "父节点", "type": "string", "notes": "父节点名称。" },
        { "name": "requirements", "localizedName": "研究需求", "type": "array", "items": { "$ref": "types/StackRequirement" }, "notes": "研究所需物品。" },
        { "name": "objectives", "localizedName": "解锁条件", "type": "array", "items": { "type": "string" }, "notes": "额外解锁条件。" }
    ]
}
```

- [ ] **Step 7: Commit**

```bash
git add schemas/curated/types/
git commit -m "feat: curated types/ 可复用子类型定义"
```

---

### Task 9: 编写 P1 curated 文件

**Files:**
- Create: `schemas/curated/Drill.json`
- Create: `schemas/curated/Item.json`
- Create: `schemas/curated/Liquid.json`
- Create: `schemas/curated/Floor.json`
- Create: `schemas/curated/Wall.json`
- Create: `schemas/curated/Conveyor.json`
- Create: `schemas/curated/PowerNode.json`
- Create: `schemas/curated/UnitType.json`
- Create: `schemas/curated/UnitFactory.json`

**数据来源:** 从 `scripts/field-usage-report.json` 提取每个类型的 Top 15 高频字段

- [ ] **Step 1-9: 逐个创建 curated 文件**

每个文件的格式同 P0，只选取频率 >20% 的字段。继承链：
- `Drill.json` → `parentType: "Block"`
- `Item.json` → `parentType: "UnlockableContent"`
- `Liquid.json` → `parentType: "UnlockableContent"`
- `Floor.json` → `parentType: "Block"`
- `Wall.json` → `parentType: "Block"`
- `Conveyor.json` → `parentType: "Block"`
- `PowerNode.json` → `parentType: "Block"`
- `UnitType.json` → `parentType: "UnlockableContent"`（不继承 Block）
- `UnitFactory.json` → `parentType: "Block"`

- [ ] **Step 10: 验证**

检查每个类型的 curated 字段数（应 < 25 个），高级模式字段数（应 > 50 个）。

- [ ] **Step 11: Commit**

```bash
git add schemas/curated/
git commit -m "feat: curated P1 文件（Drill/Item/Liquid/Floor/Wall/Conveyor/PowerNode/UnitType/UnitFactory）"
```

---

### Task 10: 端到端验证

- [ ] **Step 1: 验证静态构建**

```bash
bun run build 2>&1 | tail -10
```
确认无 webpack 错误。

- [ ] **Step 2: 功能验证清单**

| 检查项 | 预期 |
|--------|------|
| GenericCrafter 默认模式 | 显示 ~15 个字段 |
| GenericCrafter 高级模式 | 显示 ~130 个字段（全部反射） |
| 切换不丢失数据 | data state 不变 |
| requirements 数组编辑 | 可添加/删除行，每行有 item + amount |
| consumses.power 嵌套 | 显示子字段 usage/capacity/buffered |
| research 自动补全 | 输入时下拉建议已有内容名 |
| Item/Liquid 引用类型 | 输入时下拉建议 |
| 导出 HJSON 正确 | 含精选字段，不含默认值 |

- [ ] **Step 3: Commit（如有修复）**

```bash
git commit -am "fix: end-to-end 验证修复"
```
