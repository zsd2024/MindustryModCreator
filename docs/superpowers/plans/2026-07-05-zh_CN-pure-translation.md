# zh_CN 精简为纯翻译文件 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将所有 222 个 `schemas/zh_CN/*.json` 精简为纯翻译文件，移除与 EN schema 重复的结构数据。

**Architecture:** 用 Node.js 迁移脚本遍历 EN/zh_CN 文件对，从 zh_CN 提取 `localizedName` + `fields[].{name,localizedName,notes}`，去除 `type`/`parentType`/字段的 `type`/`defaultValue`/英文 `notes`。resolve-schema.js 无需改动（其查找函数已通过 `fields[].name` 匹配）。删除无引用的 `zh-docs.json`。

**Tech Stack:** Node.js, JSON

## Global Constraints

- 所有生成的 zh_CN JSON 必须通过 `JSON.parse()` 验证
- `getFieldLabel(type, fieldName)` 必须返回 `localizedName` (非 `fieldName`)
- 文件编码：UTF-8 without BOM
- 每文件末尾保留一个换行符

---

### Task 1: 编写迁移脚本

**Files:**
- Create: `scripts/migrate-zh-schemas.mjs`

**Interfaces:**
- Consumes: `schemas/*.json` (EN), `schemas/zh_CN/*.json` (旧格式)
- Produces: `schemas/zh_CN/*.json` (新格式)

- [x] **创建脚本文件**

```javascript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemasDir = path.resolve(__dirname, '../packages/turbowarp/src/lib/mindustry/schemas');
const zhDir = path.join(schemasDir, 'zh_CN');

const files = fs.readdirSync(schemasDir)
    .filter(f => f.endsWith('.json') && f !== 'zh_CN');

let ok = 0, skip = 0, err = 0;

for (const file of files) {
    const enPath = path.join(schemasDir, file);
    const zhPath = path.join(zhDir, file);

    if (!fs.existsSync(zhPath)) {
        console.log(`  SKIP (no zh_CN): ${file}`);
        skip++;
        continue;
    }

    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const zh = JSON.parse(fs.readFileSync(zhPath, 'utf8'));

    const result = {};

    if (zh.localizedName) {
        result.localizedName = zh.localizedName;
    }

    if (zh.notes) {
        result.notes = zh.notes;
    }

    if (Array.isArray(zh.fields)) {
        result.fields = zh.fields.map(f => {
            const entry = { name: f.name };
            if (f.localizedName) entry.localizedName = f.localizedName;
            if (f.notes) entry.notes = f.notes;
            return entry;
        });
    }

    const oldZhFields = (zh.fields || []).length;
    const newZhFields = (result.fields || []).length;

    fs.writeFileSync(zhPath, JSON.stringify(result, null, 4) + '\n', 'utf8');
    console.log(`  OK: ${file} (${oldZhFields} -> ${newZhFields} fields)`);
    ok++;
}

console.log(`\nDone: ${ok} converted, ${skip} skipped, ${err} errors`);
```

- [ ] **运行脚本并验证输出**

```bash
node scripts/migrate-zh-schemas.mjs
```

Expected: 所有 222 个文件 "OK"，0 skipped, 0 errors。

- [ ] **验证所有生成文件 JSON 有效**

```bash
node -e "
const fs = require('fs');
const path = require('path');
const d = 'packages/turbowarp/src/lib/mindustry/schemas/zh_CN';
const files = fs.readdirSync(d).filter(f => f.endsWith('.json'));
let ok = 0;
for (const f of files) {
    try {
        JSON.parse(fs.readFileSync(path.join(d, f)));
        ok++;
    } catch (e) {
        console.error('FAIL:', f, e.message);
    }
}
console.log('Valid:', ok, '/', files.length);
"
```

Expected: `Valid: 222 / 222`

- [ ] **检查新格式是否符合预期**

```bash
node -e "
const zh = JSON.parse(require('fs').readFileSync('packages/turbowarp/src/lib/mindustry/schemas/zh_CN/Block.json'));
console.log('Top keys:', Object.keys(zh));
console.log('Has type?', 'type' in zh);
console.log('Has parentType?', 'parentType' in zh);
console.log('Has localizedName?', 'localizedName' in zh);
console.log('Field0 keys:', Object.keys(zh.fields[0]));
console.log('Field0 has type?', 'type' in zh.fields[0]);
console.log('Field0 has defaultValue?', 'defaultValue' in zh.fields[0]);
"
```

Expected:
- `Has type?` → false
- `Has parentType?` → false
- `Has localizedName?` → true
- `Field0 has type?` → false
- `Field0 has defaultValue?` → false

---

### Task 2: 验证 resolve-schema.js 兼容性

**Files:**
- Read: `packages/turbowarp/src/lib/mindustry/resolve-schema.js`

此时 resolve-schema.js 应已无需改动——其查找函数通过 `fields[].name` 匹配，而 `name` 在新格式中保留。

- [ ] **验证 getFieldLabel 在新格式下正常工作**

```bash
node -e "
// simulate the lookup logic
const fs = require('fs');
const zh = JSON.parse(fs.readFileSync('packages/turbowarp/src/lib/mindustry/schemas/zh_CN/Block.json'));

function getFieldLabel(type, fieldName) {
    if (!zh?.fields) return fieldName;
    const field = zh.fields.find(f => f.name === fieldName);
    return field?.localizedName || fieldName;
}

// Test with known fields
console.log('hasItems:', getFieldLabel('Block', 'hasItems'));
console.log('health:', getFieldLabel('Block', 'health'));
console.log('size:', getFieldLabel('Block', 'size'));
console.log('nonexistent:', getFieldLabel('Block', 'nonexistent'));
"
```

Expected: Chinese localizedName for existing fields, 'nonexistent' for missing.

- [ ] **验证 getFieldDoc 在新格式下正常工作**

```bash
node -e "
const fs = require('fs');
const zh = JSON.parse(fs.readFileSync('packages/turbowarp/src/lib/mindustry/schemas/zh_CN/Block.json'));
function getFieldDoc(type, fieldName) {
    if (!zh?.fields) return '';
    const field = zh.fields.find(f => f.name === fieldName);
    return field?.notes || '';
}
console.log('hasItems doc:', getFieldDoc('Block', 'hasItems').slice(0, 50));
console.log('nonexistent doc:', JSON.stringify(getFieldDoc('Block', 'nonexistent')));
"
```

Expected: Chinese notes text for existing fields, `""` for missing.

- [ ] **验证所有类型上 getFieldLabel 不返回英文 fallback 给已翻译字段**

```bash
node -e "
const fs = require('fs');
const path = require('path');
const zhDir = 'packages/turbowarp/src/lib/mindustry/schemas/zh_CN';
const files = fs.readdirSync(zhDir).filter(f => f.endsWith('.json'));
let missingLabel = 0, missingDoc = 0, total = 0;
for (const f of files) {
    const zh = JSON.parse(fs.readFileSync(path.join(zhDir, f)));
    if (zh.fields) {
        for (const field of zh.fields) {
            total++;
            if (!field.localizedName) missingLabel++;
            if (!field.notes) missingDoc++;
        }
    }
}
console.log('Total fields:', total);
console.log('Missing localizedName:', missingLabel);
console.log('Missing notes:', missingDoc);
"
```

Expected: Some fields may have missing localizedName/notes (those not yet translated), but should match previous behavior.

---

### Task 3: 删除 zh-docs.json

**Files:**
- Delete: `packages/turbowarp/src/lib/mindustry/zh-docs.json`

- [ ] **确认 zh-docs.json 无引用**

```bash
grep -r "zh-docs" packages/turbowarp/src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.mjs" || echo "No references found"
```

Expected: `No references found`

- [ ] **删除 zh-docs.json**

```bash
rm packages/turbowarp/src/lib/mindustry/zh-docs.json && echo "Deleted"
```

---

### Task 4: 提交

- [ ] **检查 git 状态**

```bash
git status
```

Expected: 修改的 zh_CN 文件（~222）+ 新脚本 + 删除的 zh-docs.json + spec 文档

- [ ] **添加并提交**

```bash
git add -A && git commit -m "refactor: zh_CN schemas精简为纯翻译文件

- 迁移脚本 scripts/migrate-zh-schemas.mjs
- zh_CN/*.json 移除冗余的 type/parentType/字段type/defaultValue/英文notes
- 只保留 localizedName + fields[].{name,localizedName,notes}
- 删除无引用的 zh-docs.json (5269行)
- 添加设计文档和实施计划"
```

- [ ] **推送**

```bash
git pull --rebase && git push
```
