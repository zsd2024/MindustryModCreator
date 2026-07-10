# 复合类型注册表 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the JSON editor to handle all non-primitive, non-reference type strings (`ItemStack`, `LiquidStack`, `ItemStack[]`, `Seq of X`, `ObjectMap of K,V`, etc.) by normalizing them into structured `{type, fields, items}` definitions and reusing existing object/array renderers.

**Architecture:** A `COMPOUND_TYPES` registry maps type names to inline field definitions. A `normalizeType()` function converts string type names into structured field objects before rendering. The existing `renderObjectField`/`renderArrayField` handle the normalized output. Array rendering is enhanced to support primitive/reference element arrays alongside object arrays.

**Tech Stack:** React JSX, CSS modules

## Global Constraints

- No npm dependencies beyond what's already in the project
- Follow existing code patterns in `mindustry-json-editor.jsx`
- All new types go in a separate `compound-types.js` module
- Enum values must match Mindustry Java source

---

### Task 1: Create compound-types module

**Files:**
- Create: `packages/turbowarp/src/lib/mindustry/compound-types.js`

**Interfaces:**
- Produces: `COMPOUND_TYPES` object, `normalizeType(field)` function

- [ ] **Step 1: Create the file with COMPOUND_TYPES registry**

```js
const COMPOUND_TYPES = {
  ItemStack: {
    type: 'object',
    fields: [
      {name: 'item', type: 'Item'},
      {name: 'amount', type: 'int', defaultValue: 1},
    ],
  },
  LiquidStack: {
    type: 'object',
    fields: [
      {name: 'liquid', type: 'Liquid'},
      {name: 'amount', type: 'float', defaultValue: 1},
    ],
  },
  PathCost: {
    type: 'object',
    fields: [
      {name: 'type', type: 'Block'},
      {name: 'cost', type: 'float', defaultValue: 1},
    ],
  },
  ItemBridgeBuild: {
    type: 'object',
    fields: [
      {name: 'item', type: 'Item'},
      {name: 'sort', type: 'boolean'},
    ],
  },
};
```

- [ ] **Step 2: Implement normalizeType function**

```js
export function normalizeType(field) {
  const type = field.type;
  if (!type || type === 'object' || type === 'array') return field;

  if (COMPOUND_TYPES[type]) {
    return { ...field, ...COMPOUND_TYPES[type] };
  }

  const arrayMatch = type.match(/^(.+?)((?:\[\])+)$/);
  if (arrayMatch) {
    const baseType = arrayMatch[1];
    const arrayDepth = arrayMatch[2].length / 2;
    let items = { type: baseType };
    for (let i = 1; i < arrayDepth; i++) {
      items = { type: 'array', items };
    }
    return { ...field, type: 'array', items };
  }

  const seqMatch = type.match(/^Seq of (.+)$/);
  if (seqMatch) {
    return { ...field, type: 'array', items: { type: seqMatch[1] } };
  }

  const mapMatch = type.match(/^Object(Map|FloatMap) of (.+?),\s*(.+)$/);
  if (mapMatch) {
    const keyType = mapMatch[2];
    const valType = mapMatch[3];
    return {
      ...field, type: 'array',
      items: {
        type: 'object',
        fields: [
          {name: 'key', type: keyType, localizedName: '键'},
          {name: 'value', type: valType, localizedName: '值'},
        ],
      },
    };
  }

  const setMatch = type.match(/^ObjectSet of (.+)$/);
  if (setMatch) {
    return {
      ...field, type: 'array',
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

- [ ] **Step 3: Export everything**

```js
export { COMPOUND_TYPES, normalizeType };
```

- [ ] **Step 4: Verify file syntax**

Run: `node -e "require('./packages/turbowarp/src/lib/mindustry/compound-types.js')"` or just check syntax with a JS parser.

---

### Task 2: Integrate normalizeType into mindustry-json-editor.jsx

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`

- [ ] **Step 1: Add import**

```js
import {normalizeType} from '../../lib/mindustry/compound-types';
```

- [ ] **Step 2: Call normalizeType at the start of renderField**

Replace:
```js
renderField(field) {
```
With:
```js
renderField(rawField) {
  const field = normalizeType(rawField);
```

- [ ] **Step 3: Verify the rendering in the browser**

When editing a GenericCrafter:
- `outputItem` (type `ItemStack`) → should show nested {item, amount} object editor
- `outputItems` (type `ItemStack[]`) → should show array of ItemStack editors
- Number/string/text fields unchanged

---

### Task 3: Enhance renderArrayField for primitive/reference element arrays

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`

- [ ] **Step 1: Normalize itemDef in renderArrayField**

At the top of `renderArrayField`, normalize the itemDef so compound types inside arrays (e.g. `ItemStack[]`) get their fields resolved:

```js
const itemDef = field.items;
const normalizedItemDef = itemDef ? normalizeType(itemDef) : null;
const subFields = normalizedItemDef && normalizedItemDef.fields;
```

Replace the existing `const itemDef = field.items; const subFields = itemDef && itemDef.fields;` with the normalized version.

- [ ] **Step 2: Add branch for non-object array items in renderArrayField**

After the existing object-item branch, add a branch for when items are primitives or references.

Replace:
```js
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
```

With:
```js
const isObjectArray = subFields && subFields.length > 0;

const addItem = () => {
  if (!isObjectArray) {
    const defaultVal = itemDef ? this.parseDefault(itemDef) : '';
    this.handleChange(field.name, [...items, defaultVal]);
    return;
  }
  const defaults = {};
  for (const sf of subFields) {
    if (sf.defaultValue !== undefined) {
      defaults[sf.name] = this.parseDefault(sf);
    }
  }
  this.handleChange(field.name, [...items, defaults]);
};

const removeItem = (idx) => {
  this.handleChange(field.name, items.filter((_, i) => i !== idx));
};

const updateItem = (idx, name, val) => {
  this.handleChange(field.name, items.map((item, i) =>
    i === idx ? (name ? { ...item, [name]: val } : val) : item
  ));
};
```

- [ ] **Step 2: Render primitive/reference elements inline**

In the JSX, replace the item body:

```js
<div className={styles.arrayItemBody}>
  {(subFields || []).map(sf => {
    const sfValue = item[sf.name] !== undefined
      ? item[sf.name]
      : this.parseDefault(sf);
    return (
      <div className={styles.nestedFieldRow} key={sf.name}>
        <span className={styles.nestedFieldLabel}>
          {getFieldLabel(field.sourceType, sf.name) || sf.localizedName || sf.name}
        </span>
        <div className={styles.nestedFieldControl}>
          {this.renderControlInline(sf, sfValue, (val) => updateItem(idx, sf.name, val))}
        </div>
      </div>
    );
  })}
</div>
```

With:
```jsx
<div className={styles.arrayItemBody}>
  {isObjectArray ? ((subFields || []).map(sf => {
    const sfValue = item[sf.name] !== undefined
      ? item[sf.name]
      : this.parseDefault(sf);
    return (
      <div className={styles.nestedFieldRow} key={sf.name}>
        <span className={styles.nestedFieldLabel}>
          {getFieldLabel(field.sourceType, sf.name) || sf.localizedName || sf.name}
        </span>
        <div className={styles.nestedFieldControl}>
          {this.renderControlInline(sf, sfValue, (val) => updateItem(idx, sf.name, val))}
        </div>
      </div>
    );
  })) : (
    <div className={styles.nestedFieldControl}>
      {this.renderControlInline(
        itemDef || {type: 'string'},
        item,
        (val) => updateItem(idx, null, val)
      )}
    </div>
  )}
</div>
```

- [ ] **Step 3: Verify in browser**

Editing `int[]` field → should show a list of number inputs with add/remove buttons.
Editing `TextureRegion[]` field → should show a list of content selector inputs.
Editing `ItemStack[]` field (e.g., `outputItems`) → should show array of {item, amount} objects.

---

### Task 4: Add ENUM_VALUES for new types

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`

- [ ] **Step 1: Add Interp values**

```js
interp: [
  {value: 'linear', cn: '线性'},
  {value: 'slope', cn: '倾斜'},
  {value: 'reverse', cn: '反向'},
  {value: 'one', cn: '恒定1'},
  {value: 'zero', cn: '恒定0'},
  {value: 'fast', cn: '快入'},
  {value: 'slow', cn: '慢入'},
  {value: 'pow2', cn: '平方'},
  {value: 'pow2In', cn: '平方入'},
  {value: 'pow2Out', cn: '平方出'},
  {value: 'pow2InOut', cn: '平方出入'},
  {value: 'pow3', cn: '立方'},
  {value: 'pow3In', cn: '立方入'},
  {value: 'pow3Out', cn: '立方出'},
  {value: 'pow3InOut', cn: '立方出入'},
  {value: 'pow4', cn: '四次方'},
  {value: 'pow4In', cn: '四次方入'},
  {value: 'pow4Out', cn: '四次方出'},
  {value: 'pow4InOut', cn: '四次方出入'},
  {value: 'pow5', cn: '五次方'},
  {value: 'pow5In', cn: '五次方入'},
  {value: 'pow5Out', cn: '五次方出'},
  {value: 'pow5InOut', cn: '五次方出入'},
  {value: 'sine', cn: '正弦'},
  {value: 'sineIn', cn: '正弦入'},
  {value: 'sineOut', cn: '正弦出'},
  {value: 'sineInOut', cn: '正弦出入'},
  {value: 'circle', cn: '圆形'},
  {value: 'circleIn', cn: '圆形入'},
  {value: 'circleOut', cn: '圆形出'},
  {value: 'circleInOut', cn: '圆形出入'},
  {value: 'swing', cn: '摇摆'},
  {value: 'swingIn', cn: '摇摆入'},
  {value: 'swingOut', cn: '摇摆出'},
  {value: 'swingInOut', cn: '摇摆出入'},
  {value: 'elastic', cn: '弹性'},
  {value: 'elasticIn', cn: '弹性入'},
  {value: 'elasticOut', cn: '弹性出'},
  {value: 'elasticInOut', cn: '弹性出入'},
  {value: 'bounce', cn: '弹跳'},
  {value: 'bounceIn', cn: '弹跳入'},
  {value: 'bounceOut', cn: '弹跳出'},
  {value: 'bounceInOut', cn: '弹跳出入'},
  {value: 'fade', cn: '淡入淡出'},
  {value: 'fadeIn', cn: '淡入'},
  {value: 'fadeOut', cn: '淡出'},
  {value: 'fadeInOut', cn: '淡入淡出'},
  {value: 'accel', cn: '加速'},
  {value: 'decel', cn: '减速'},
  {value: 'acceldecel', cn: '加减速'},
  {value: 'smooth', cn: '平滑'},
  {value: 'smooth2', cn: '平滑2'},
  {value: 'dense', cn: '密集'},
  {value: 'expIn', cn: '指数入'},
  {value: 'expOut', cn: '指数出'},
  {value: 'expInOut', cn: '指数出入'},
],
```

- [ ] **Step 2: Add Blending values**

```js
blending: [
  {value: 'normal', cn: '正常'},
  {value: 'additive', cn: '叠加'},
  {value: 'alpha', cn: 'Alpha'},
  {value: 'disabled', cn: '禁用'},
],
```

- [ ] **Step 3: Add CacheLayer values**

```js
cacheLayer: [
  {value: 'normal', cn: '正常'},
  {value: 'walls', cn: '墙壁'},
  {value: 'water', cn: '水'},
  {value: 'tar', cn: '焦油'},
  {value: 'molten', cn: '熔融'},
],
```

- [ ] **Step 4: Add BlockGroup values**

```js
blockGroup: [
  {value: 'none', cn: '无'},
  {value: 'walls', cn: '墙壁'},
  {value: 'projectors', cn: '投影器'},
  {value: 'turrets', cn: '炮塔'},
  {value: 'transportation', cn: '运输'},
  {value: 'payloads', cn: '载荷'},
  {value: 'liquids', cn: '液体'},
  {value: 'power', cn: '电力'},
  {value: 'drills', cn: '钻头'},
  {value: 'logic', cn: '逻辑'},
  {value: 'cells', cn: '细胞'},
],
```

- [ ] **Step 5: Enhance renderControlInline to match by field.type (not just field.name)**

Currently ENUM_VALUES lookup is by `field.name` (e.g. `ENUM_VALUES[field.name]`). For types like `Interp`, we need to also check by `field.type`. Add a fallback:

```js
const rawOptions = field.options || ENUM_VALUES[field.name] || ENUM_VALUES[field.type];
```

This way, any field with `type: "Interp"` gets the `ENUM_VALUES.Interp` dropdown, regardless of the field name.

- [ ] **Step 6: Verify in browser**

Editing an `Interp` field (e.g., `interp` on ParticleEffect) → shows searchable dropdown with Chinese names.
Editing a `Blending` field → shows dropdown with 4 options.
Editing `cacheLayer` on Block → shows dropdown with 5 options.
Editing `group` on Block → shows dropdown with 11 options.

---

### Task 5: Handle EnumSet of BlockFlag and other collection types

**Files:**
- Modify: `packages/turbowarp/src/lib/mindustry/compound-types.js`
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`

- [ ] **Step 1: Add EnumSet pattern to normalizeType**

```js
const enumSetMatch = type.match(/^EnumSet of (.+)$/);
if (enumSetMatch) {
  return { ...field, type: 'array', items: { type: enumSetMatch[1] } };
}
```

- [ ] **Step 2: Add BlockFlag ENUM_VALUES**

```js
blockFlag: [
  {value: 'core', cn: '核心'},
  {value: 'reactor', cn: '反应堆'},
  {value: 'generator', cn: '发电机'},
  {value: 'drill', cn: '钻头'},
  {value: 'factory', cn: '工厂'},
  {value: 'battery', cn: '电池'},
  {value: 'turret', cn: '炮塔'},
  {value: 'repair', cn: '维修'},
  {value: 'launchPad', cn: '发射台'},
  {value: 'command', cn: '指挥'},
  {value: 'unitFactory', cn: '单位工厂'},
  {value: 'overdriveProjector', cn: '超速投影'},
  {value: 'forceProjector', cn: '力墙投影'},
  {value: 'message', cn: '信息板'},
  {value: 'all', cn: '全部'},
],
```

---

### Task 6: Add Attribute and Sortf ENUM_VALUES

**Files:**
- Modify: `packages/turbowarp/src/components/mindustry-json-editor/mindustry-json-editor.jsx`

- [ ] **Step 1: Add Attribute values**

```js
attribute: [
  {value: 'water', cn: '水'},
  {value: 'heat', cn: '热量'},
  {value: 'oil', cn: '石油'},
  {value: 'sand', cn: '沙'},
  {value: 'spores', cn: '孢子'},
],
```

- [ ] **Step 2: Add Sortf values**

```js
sortf: [
  {value: 'closest', cn: '最近'},
  {value: 'farthest', cn: '最远'},
  {value: 'health', cn: '生命值'},
  {value: 'maxHealth', cn: '最大生命值'},
  {value: 'shield', cn: '护盾'},
  {value: 'damage', cn: '伤害'},
  {value: 'armor', cn: '护甲'},
  {value: 'speed', cn: '速度'},
],
```

---

### Self-Review Checklist

1. **Spec coverage:** The spec covers compound objects (ItemStack, LiquidStack), array notation (`[]`, `Seq of`), map notation (`ObjectMap of`), and enum types. Each corresponds to a task above. ✓
2. **Placeholder scan:** All code blocks contain real code. No TBD/TODO. ✓
3. **Type consistency:** normalizeType returns `{...field, type: 'array', items: {...}}` which matches what renderArrayField expects. `updateItem` change handles both object and primitive arrays. ✓
