# zh_CN Schema 精简为纯翻译文件

## 背景

MindustryModCreator 的 Schema 系统有 222 对 EN/zh_CN JSON 文件：

- `schemas/Block.json` (EN) — 结构定义：`type`, `parentType`, `fields[{name, type, defaultValue, notes}]`
- `schemas/zh_CN/Block.json` (zh_CN) — 翻译 + 结构重复：`type`, `parentType`, `localizedName`, `fields[{name, type, defaultValue, notes, localizedName}]`

zh_CN 文件完整复制了 EN 的结构字段（type、parentType、字段的 type/defaultValue/notes），导致：
- 222 份冗余数据（新增/修改字段需同步改两份文件）
- 职责不清晰（zh_CN 本应只负责翻译）
- 文件体积膨胀

## 目标

将 zh_CN schema 精简为纯翻译文件，只保留 `localizedName`（类型名/字段名翻译）和 `notes`（文档翻译），移除所有与 EN 重复的结构数据。

## 文件格式变化

### 当前格式

```json
{
    "type": "Planet",
    "parentType": "UnlockableContent",
    "localizedName": "行星",
    "fields": [
        {
            "name": "radius",
            "type": "float",
            "defaultValue": "null",
            "notes": "中文注释...\n\n**Notes**: 补充说明...",
            "localizedName": "半径"
        }
    ]
}
```

### 目标格式

```json
{
    "localizedName": "行星",
    "notes": "类型级别说明（可选）",
    "fields": [
        {
            "name": "radius",
            "localizedName": "半径",
            "notes": "中文注释...\n\n**Notes**: 补充说明..."
        }
    ]
}
```

**移除的字段：**
- 顶层：`type`, `parentType`
- 字段内：`type`, `defaultValue`, 英文 `notes`

**保留的字段：**
- 顶层：`localizedName`, `notes`(可选)
- 字段内：`name`（用于匹配 EN schema 中的对应字段）, `localizedName`, `notes`

## resolve-schema.js 改动

现有的查找函数已经通过 zh_CN schema 的 `fields[].name` 进行匹配：

| 函数 | 当前实现 | 是否需要改动 |
|------|---------|------------|
| `getZhLabel(key)` | `loadZh(key)?.localizedName` | 不变 |
| `getZhDoc(key)` | `loadZh(key)?.notes` | 不变 |
| `getFieldLabel(type, fieldName)` | 搜索 `zh.fields[].name` → `localizedName` | 不变 |
| `getFieldDoc(type, fieldName)` | 搜索 `zh.fields[].name` → `notes` | 不变 |

由于 `name` 作为匹配键保留，查找逻辑不需要任何代码改动。

## zh-docs.json

该文件已无任何代码引用，可安全删除。其数据已完全由 zh_CN schema 文件覆盖。

## 迁移方案

1. 编写 Node.js 迁移脚本 `scripts/migrate-zh-schemas.mjs`
2. 脚本遍历 `schemas/` 和 `schemas/zh_CN/` 目录
3. 对每对文件：从 zh_CN 提取 `localizedName` 和 `fields[].{name,localizedName,notes}`，写入精简格式
4. 校验输出的 JSON 有效性
5. 更新 resolve-schema.js（如有必要）
6. 删除 zh-docs.json
7. 提交并推送

## 验证

- `node -e "JSON.parse(...)"` 验证所有 222 个生成文件格式正确
- 前端 `getFieldLabel` / `getFieldDoc` 等函数在所有类型上返回非空值
- 字段查找匹配（name 作为键）行为不变
